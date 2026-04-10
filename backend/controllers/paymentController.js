import axios from "axios";
import crypto from "crypto";
import Booking, { BOOKING_STATUS, PAYMENT_STATUS } from "../models/Booking.js";
import Notification, { NOTIF_TYPES } from "../models/Notification.js";

// ── eSewa v2 ──────────────────────────────────────────────────────────────────
const ESEWA_PRODUCT_CODE = process.env.ESEWA_SCD || "EPAYTEST";
const ESEWA_SECRET = process.env.ESEWA_SECRET || "8gBm/:&EnhH.1/q";
const ESEWA_FORM_URL =
  process.env.ESEWA_GATEWAY_URL ||
  "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_STATUS_URL =
  "https://rc-epay.esewa.com.np/api/epay/transaction/status/";

// ── Khalti v2 (Sandbox) ───────────────────────────────────────────────────────
// Sandbox base: https://dev.khalti.com/api/v2/
// Production base: https://khalti.com/api/v2/
// Test credentials: 9800000001 / MPIN: 1111 / OTP: 987654
// Get your sandbox key from: https://test-admin.khalti.com
const KHALTI_SECRET =
  process.env.KHALTI_SECRET_KEY ||
  "live_secret_key_68791341fdd94846a146f0457ff7b455";
const KHALTI_INITIATE_URL = "https://dev.khalti.com/api/v2/epayment/initiate/";
const KHALTI_LOOKUP_URL = "https://dev.khalti.com/api/v2/epayment/lookup/";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// ── eSewa HMAC signature ──────────────────────────────────────────────────────
function esewaSignature(totalAmount, transactionUuid) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`;
  return crypto
    .createHmac("sha256", ESEWA_SECRET)
    .update(message)
    .digest("base64");
}

// ── Mark booking payment paid ─────────────────────────────────────────────────
async function markBookingPaid(bookingId, method, gatewayRef) {
  const booking = await Booking.findById(bookingId).populate("vehicle", "name");
  if (!booking) return null;
  if (booking.paymentStatus === PAYMENT_STATUS.PAID) return booking;

  booking.paymentMethod = method;
  booking.paymentStatus = PAYMENT_STATUS.PAID;
  booking.paidAt = new Date();
  booking.paymentDetails.reference = gatewayRef || null;

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

// ── Mark fine paid ────────────────────────────────────────────────────────────
async function markFinePaid(bookingId, method, gatewayRef) {
  const booking = await Booking.findById(bookingId).populate("vehicle", "name");
  if (!booking) return null;
  if (booking.finePaid) return booking; // idempotent

  booking.finePaid = true;
  booking.finePaidAt = new Date();
  booking.finePaidVia = method;
  booking.paymentDetails.reference = gatewayRef || null;

  try {
    await Notification.create({
      recipient: booking.customer,
      type: NOTIF_TYPES.PAYMENT_SUCCESS,
      title: "Late return fine paid",
      message: `Your late return fine of Rs ${booking.fine.toLocaleString()} has been paid via ${method}. Thank you.`,
      booking: booking._id,
    });
  } catch {}

  await booking.save();
  return booking;
}

// ═════════════════════════════════════════════════════════════════════════════
// eSEWA — BOOKING PAYMENT
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/pay/esewa/initiate
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
      return res.status(400).json({ message: "Invalid booking status." });

    const amt = booking.totalPrice;
    const txnUuid = `TXN-${bookingId}-${Date.now()}`;

    res.json({
      gateway_url: ESEWA_FORM_URL,
      amount: amt,
      tax_amount: 0,
      total_amount: amt,
      transaction_uuid: txnUuid,
      product_code: ESEWA_PRODUCT_CODE,
      signature: esewaSignature(amt, txnUuid),
      success_url: `${BACKEND_URL}/api/pay/esewa/success`,
      failure_url: `${FRONTEND_URL}/payment/esewa/return?status=failed&bookingId=${bookingId}`,
    });
  } catch (e) {
    console.error("esewaInitiate:", e);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/pay/esewa/success  (eSewa redirects browser here)
export const esewaSuccess = async (req, res) => {
  try {
    const { data } = req.query;
    if (!data)
      return res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    } catch {
      return res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);
    }

    const { transaction_uuid, transaction_code, status } = decoded;
    if (status !== "COMPLETE")
      return res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);

    // Find booking by uuid prefix TXN-{bookingId}-{timestamp}
    const bookingId = transaction_uuid.split("-")[1];
    const booking = await markBookingPaid(bookingId, "eSewa", transaction_code);
    if (!booking)
      return res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);

    res.redirect(
      `${FRONTEND_URL}/payment/esewa/return?status=success&bookingId=${booking._id}`,
    );
  } catch (e) {
    console.error("esewaSuccess:", e);
    res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// eSEWA — FINE PAYMENT
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/pay/esewa/fine/initiate
export const esewaFineInitiate = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (String(booking.customer) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorised." });
    if (!booking.fine || booking.fine === 0)
      return res.status(400).json({ message: "No fine on this booking." });
    if (booking.finePaid)
      return res.status(400).json({ message: "Fine already paid." });

    const amt = booking.fine;
    const txnUuid = `FINE-${bookingId}-${Date.now()}`;

    res.json({
      gateway_url: ESEWA_FORM_URL,
      amount: amt,
      tax_amount: 0,
      total_amount: amt,
      transaction_uuid: txnUuid,
      product_code: ESEWA_PRODUCT_CODE,
      signature: esewaSignature(amt, txnUuid),
      success_url: `${BACKEND_URL}/api/pay/esewa/fine/success`,
      failure_url: `${FRONTEND_URL}/payment/esewa/return?status=failed&bookingId=${bookingId}`,
    });
  } catch (e) {
    console.error("esewaFineInitiate:", e);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/pay/esewa/fine/success
export const esewaFineSuccess = async (req, res) => {
  try {
    const { data } = req.query;
    if (!data)
      return res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    } catch {
      return res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);
    }

    const { transaction_uuid, transaction_code, status } = decoded;
    if (status !== "COMPLETE")
      return res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);

    // FINE-{bookingId}-{timestamp}
    const bookingId = transaction_uuid.split("-")[1];
    const booking = await markFinePaid(bookingId, "eSewa", transaction_code);
    if (!booking)
      return res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);

    res.redirect(
      `${FRONTEND_URL}/payment/esewa/return?status=success&bookingId=${booking._id}&type=fine`,
    );
  } catch (e) {
    console.error("esewaFineSuccess:", e);
    res.redirect(`${FRONTEND_URL}/payment/fine/esewa/return?status=failed`);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// KHALTI — BOOKING PAYMENT
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/pay/khalti/initiate
export const khaltiInitiate = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate(
      "customer",
      "name email phone",
    );
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (String(booking.customer._id) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorised." });
    if (booking.paymentStatus === PAYMENT_STATUS.PAID)
      return res.status(400).json({ message: "Already paid." });

    const { data } = await axios.post(
      KHALTI_INITIATE_URL,
      {
        return_url: `${FRONTEND_URL}/payment/khalti/return`,
        website_url: `${FRONTEND_URL}`,
        amount: booking.totalPrice * 100, // paisa
        purchase_order_id: String(bookingId),
        purchase_order_name: `VoyageGo Booking`,
        customer_info: {
          name: booking.customer?.name || "Customer",
          email: booking.customer?.email || "customer@voyagego.com",
          phone: booking.customer?.phone || "9800000000",
        },
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
    res
      .status(500)
      .json({
        message:
          e.response?.data?.detail || "Failed to initiate Khalti payment.",
      });
  }
};

// POST /api/pay/khalti/verify  { pidx }
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
        .json({ message: `Khalti payment status: ${data.status}` });

    const bookingId = data.purchase_order_id;
    const booking = await markBookingPaid(bookingId, "Khalti", pidx);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    res.json({ message: "Payment verified.", booking });
  } catch (e) {
    console.error("khaltiVerify:", e.response?.data || e.message);
    res.status(500).json({ message: "Khalti verification failed." });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// KHALTI — FINE PAYMENT
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/pay/khalti/fine/initiate
export const khaltiFinInitiate = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate(
      "customer",
      "name email phone",
    );
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (String(booking.customer._id) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorised." });
    if (!booking.fine || booking.fine === 0)
      return res.status(400).json({ message: "No fine on this booking." });
    if (booking.finePaid)
      return res.status(400).json({ message: "Fine already paid." });

    const { data } = await axios.post(
      KHALTI_INITIATE_URL,
      {
        return_url: `${FRONTEND_URL}/payment/fine/khalti/return`,
        website_url: `${FRONTEND_URL}`,
        amount: booking.fine * 100, // paisa
        purchase_order_id: `FINE-${bookingId}`,
        purchase_order_name: `VoyageGo Late Return Fine`,
        customer_info: {
          name: booking.customer?.name || "Customer",
          email: booking.customer?.email || "customer@voyagego.com",
          phone: booking.customer?.phone || "9800000000",
        },
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
    console.error("khaltiFinInitiate:", e.response?.data || e.message);
    res
      .status(500)
      .json({
        message:
          e.response?.data?.detail || "Failed to initiate Khalti fine payment.",
      });
  }
};

// POST /api/pay/khalti/fine/verify  { pidx }
export const khaltiFinVerify = async (req, res) => {
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
      return res.status(400).json({ message: `Khalti status: ${data.status}` });

    // purchase_order_id = "FINE-{bookingId}"
    const bookingId = data.purchase_order_id.replace("FINE-", "");
    const booking = await markFinePaid(bookingId, "Khalti", pidx);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    res.json({ message: "Fine payment verified.", booking });
  } catch (e) {
    console.error("khaltiFinVerify:", e.response?.data || e.message);
    res.status(500).json({ message: "Khalti fine verification failed." });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// DEMO PAY — booking (FYP fallback)
// ═════════════════════════════════════════════════════════════════════════════
export const demoPay = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Not found." });
    if (String(booking.customer) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorised." });

    booking.paymentMethod = "Demo";
    booking.paymentStatus = PAYMENT_STATUS.PAID;
    booking.paidAt = new Date();
    booking.paymentDetails.reference = `DEMO-${Date.now()}`;
    if (
      !booking.requiresDriver ||
      booking.status === BOOKING_STATUS.CONFIRMED
    ) {
      booking.status = BOOKING_STATUS.ACTIVE;
    }
    await booking.save();
    res.json({ message: "Demo payment recorded.", booking });
  } catch (e) {
    res.status(500).json({ message: "Server error." });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// DEMO FINE PAY — fine (FYP fallback)
// ═════════════════════════════════════════════════════════════════════════════
export const demoFinePay = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Not found." });
    if (String(booking.customer) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorised." });

    booking.finePaid = true;
    booking.finePaidAt = new Date();
    booking.finePaidVia = "Demo";
    await booking.save();
    res.json({ message: "Demo fine payment recorded.", booking });
  } catch (e) {
    res.status(500).json({ message: "Server error." });
  }
};
