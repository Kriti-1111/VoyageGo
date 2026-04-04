import axios from "axios";
import crypto from "crypto";
import Booking, { BOOKING_STATUS, PAYMENT_STATUS } from "../models/Booking.js";
import Notification, { NOTIF_TYPES } from "../models/Notification.js";

// ── eSewa v2 Sandbox (RC) ─────────────────────────────────────────────────────
// uat.esewa.com.np is permanently down. rc-epay.esewa.com.np is the correct
// current sandbox for EPAYTEST credentials.
//
// Test credentials:
//   eSewa ID: 9806800001  Password: Nepal@123  MPIN: 1122  OTP: 123456
//
const ESEWA_PRODUCT_CODE = process.env.ESEWA_SCD || "EPAYTEST";
const ESEWA_SECRET = process.env.ESEWA_SECRET || "8gBm/:&EnhH.1/q";
const ESEWA_FORM_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_STATUS_URL =
  "https://rc-epay.esewa.com.np/api/epay/transaction/status/";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Khalti ────────────────────────────────────────────────────────────────────
const KHALTI_SECRET =
  process.env.KHALTI_SECRET_KEY ||
  "test_secret_key_f59e8b7d18b4499ca40f68195a846e9b";
const KHALTI_INITIATE_URL = "https://a.khalti.com/api/v2/epayment/initiate/";
const KHALTI_LOOKUP_URL = "https://a.khalti.com/api/v2/epayment/lookup/";

// ── Generate eSewa v2 HMAC-SHA256 signature ───────────────────────────────────
// eSewa requires: HMAC-SHA256 of "total_amount=X,transaction_uuid=Y,product_code=Z"
// using the merchant secret key, base64-encoded.
function esewaSignature(totalAmount, transactionUuid) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`;
  return crypto
    .createHmac("sha256", ESEWA_SECRET)
    .update(message)
    .digest("base64");
}

// ── Shared: mark booking paid + auto-activate ─────────────────────────────────
async function markPaid(bookingId, method, gatewayRef) {
  const booking = await Booking.findById(bookingId).populate("vehicle", "name");
  if (!booking) return null;
  if (booking.paymentStatus === PAYMENT_STATUS.PAID) return booking; // idempotent

  booking.paymentMethod = method;
  booking.paymentStatus = PAYMENT_STATUS.PAID;
  booking.paidAt = new Date();
  booking.paymentDetails.reference = gatewayRef || null;

  // Self-drive (PendingPayment) or driver already confirmed (Confirmed) → Active
  if (!booking.requiresDriver || booking.status === BOOKING_STATUS.CONFIRMED) {
    booking.status = BOOKING_STATUS.ACTIVE;
    try {
      await Notification.create({
        recipient: booking.customer,
        type: NOTIF_TYPES.BOOKING_ACTIVE,
        title: "Booking confirmed and active",
        message: `Payment received. Your booking for ${booking.vehicle?.name || "the vehicle"} is now active.`,
        booking: booking._id,
      });
    } catch {}
  }

  try {
    await Notification.create({
      recipient: booking.customer,
      type: NOTIF_TYPES.PAYMENT_SUCCESS,
      title: "Payment successful",
      message: `Your payment of Rs ${booking.totalPrice.toLocaleString()} was received via ${method}.`,
      booking: booking._id,
    });
  } catch {}

  await booking.save();
  return booking;
}

// ─────────────────────────────────────────────────────────────────────────────
// eSewa v2: Initiate — returns signed form params for frontend to POST
// POST /api/pay/esewa/initiate
//
// v2 required fields:
//   amount, tax_amount, total_amount, transaction_uuid,
//   product_code, product_service_charge, product_delivery_charge,
//   success_url, failure_url, signed_field_names, signature
// ─────────────────────────────────────────────────────────────────────────────
export const esewaInitiate = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (String(booking.customer) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorised." });
    if (booking.paymentStatus === PAYMENT_STATUS.PAID)
      return res.status(400).json({ message: "Already paid." });
    if (
      [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(
        booking.status,
      )
    )
      return res
        .status(400)
        .json({ message: "Invalid booking status for payment." });

    const amt = booking.totalPrice;

    // transaction_uuid: alphanumeric + hyphen only. We embed bookingId so we
    // can extract it back from the response without a DB lookup by transaction ID.
    // MongoDB ObjectIDs are 24 hex chars (no hyphens), so split by "-" is safe.
    const txnUuid = `TXN-${bookingId}-${Date.now()}`;
    const signature = esewaSignature(amt, txnUuid);

    res.json({
      url: ESEWA_FORM_URL,
      params: {
        amount: amt,
        tax_amount: 0,
        total_amount: amt,
        transaction_uuid: txnUuid,
        product_code: ESEWA_PRODUCT_CODE,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: `${FRONTEND_URL}/payment/esewa/return`,
        failure_url: `${FRONTEND_URL}/payment/esewa/failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      },
    });
  } catch (e) {
    console.error("esewaInitiate:", e);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// eSewa v2: Verify — called by EsewaReturn after redirect
// GET /api/pay/esewa/verify?data=BASE64_JSON
//
// eSewa v2 appends ?data=BASE64_JSON to success_url.
// Decoded JSON contains: transaction_uuid, total_amount, status, transaction_code
// ─────────────────────────────────────────────────────────────────────────────
export const esewaVerify = async (req, res) => {
  try {
    const { data } = req.query;

    if (!data)
      return res.status(400).json({ message: "Missing eSewa data param." });

    // Decode the base64 JSON payload
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    } catch {
      return res.status(400).json({ message: "Invalid eSewa data payload." });
    }

    const { transaction_uuid, total_amount, status, transaction_code } =
      decoded;

    if (status !== "COMPLETE")
      return res
        .status(400)
        .json({ message: `eSewa payment not completed (status: ${status}).` });

    // Server-side verification — ALWAYS verify with eSewa, never trust the redirect alone
    const verifyRes = await axios.get(ESEWA_STATUS_URL, {
      params: {
        product_code: ESEWA_PRODUCT_CODE,
        transaction_uuid,
        total_amount,
      },
    });

    if (verifyRes.data?.status !== "COMPLETE")
      return res
        .status(400)
        .json({ message: "eSewa server verification failed." });

    // Extract bookingId from transaction_uuid format: "TXN-{bookingId}-{timestamp}"
    // MongoDB ObjectIDs have no hyphens, so split by "-" is unambiguous.
    const parts = transaction_uuid.split("-");
    const bookingId = parts[1];

    if (!bookingId)
      return res
        .status(400)
        .json({ message: "Could not extract booking ID from transaction." });

    const booking = await markPaid(bookingId, "eSewa", transaction_code);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    res.json({ message: "Payment verified. Booking is now active.", booking });
  } catch (e) {
    console.error("esewaVerify:", e.message);
    res
      .status(500)
      .json({ message: "Verification error. Please contact support." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Khalti: Initiate
// POST /api/pay/khalti/initiate
// ─────────────────────────────────────────────────────────────────────────────
export const khaltiInitiate = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate(
      "vehicle",
      "name",
    );
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (String(booking.customer) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorised." });
    if (booking.paymentStatus === PAYMENT_STATUS.PAID)
      return res.status(400).json({ message: "Already paid." });

    const { data } = await axios.post(
      KHALTI_INITIATE_URL,
      {
        return_url: `${FRONTEND_URL}/payment/khalti/return`,
        website_url: `${FRONTEND_URL}`,
        amount: booking.totalPrice * 100, // Khalti uses paisa
        purchase_order_id: String(bookingId),
        purchase_order_name: `VoyageGo - ${booking.vehicle?.name || "Booking"}`,
      },
      {
        headers: {
          Authorization: `Key ${KHALTI_SECRET}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.json({ payment_url: data.payment_url, pidx: data.pidx });
  } catch (e) {
    console.error("khaltiInitiate:", e.response?.data || e.message);
    res.status(500).json({ message: "Failed to initiate Khalti payment." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Khalti: Verify
// POST /api/pay/khalti/verify  { pidx }
// ─────────────────────────────────────────────────────────────────────────────
export const khaltiVerify = async (req, res) => {
  try {
    const { pidx } = req.body;
    if (!pidx) return res.status(400).json({ message: "Missing pidx." });

    const { data } = await axios.post(
      KHALTI_LOOKUP_URL,
      { pidx },
      {
        headers: {
          Authorization: `Key ${KHALTI_SECRET}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (data.status !== "Completed")
      return res
        .status(400)
        .json({ message: `Khalti payment status: ${data.status}.` });

    const bookingId = data.purchase_order_id;
    const booking = await markPaid(bookingId, "Khalti", pidx);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    res.json({ message: "Payment verified. Booking is now active.", booking });
  } catch (e) {
    console.error("khaltiVerify:", e.response?.data || e.message);
    res.status(500).json({ message: "Khalti verification failed." });
  }
};
