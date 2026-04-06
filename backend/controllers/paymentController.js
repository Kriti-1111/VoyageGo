import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Booking, { BOOKING_STATUS, PAYMENT_STATUS } from "../models/Booking.js";
import Notification, { NOTIF_TYPES } from "../models/Notification.js";
import {
  generateEsewaSignature,
  verifyEsewaSignature,
} from "../utils/esewa.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// ── Shared: mark booking paid + auto-activate ─────────────────────────────────
async function markPaid(bookingId, method, gatewayRef) {
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

// ─────────────────────────────────────────────────────────────────────────────
// eSewa: Initiate payment
// POST /api/pay/esewa/initiate
// ─────────────────────────────────────────────────────────────────────────────
export const esewaInitiate = async (req, res) => {
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
    if (
      [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(
        booking.status,
      )
    )
      return res
        .status(400)
        .json({ message: "Invalid booking status for payment." });

    const amount = booking.totalPrice;
    const tax_amount = 0;
    const total_amount = amount + tax_amount;
    const transaction_uuid = uuidv4();
    const product_code = process.env.ESEWA_PRODUCT_CODE;

    const signature = generateEsewaSignature({
      total_amount,
      transaction_uuid,
      product_code,
    });

    booking.esewaTransactionUuid = transaction_uuid;
    await booking.save();

    res.json({
      gateway_url: process.env.ESEWA_GATEWAY_URL,
      amount,
      tax_amount,
      total_amount,
      transaction_uuid,
      product_code,
      signature,
      success_url: `${BACKEND_URL}/api/pay/esewa/success`,
      failure_url: `${FRONTEND_URL}/payment/esewa/return?status=failed&bookingId=${bookingId}`,
    });
  } catch (err) {
    console.error("esewaInitiate:", err);
    res.status(500).json({ message: "Could not initiate eSewa payment." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// eSewa: Success callback — eSewa redirects the browser here after payment
// GET /api/pay/esewa/success
// ─────────────────────────────────────────────────────────────────────────────
export const esewaSuccess = async (req, res) => {
  try {
    const { data } = req.query;
    if (!data)
      return res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);

    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));

    // 1. Verify HMAC signature — sufficient for FYP sandbox
    if (!verifyEsewaSignature(decoded))
      return res.redirect(
        `${FRONTEND_URL}/payment/esewa/return?status=failed&reason=invalid_signature`,
      );

    const { transaction_uuid, transaction_code } = decoded;

    // 2. Find booking by the uuid saved at initiation
    const found = await Booking.findOne({
      esewaTransactionUuid: transaction_uuid,
    });
    if (!found)
      return res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);

    // 3. Mark paid + activate
    const booking = await markPaid(found._id, "eSewa", transaction_code);
    await Booking.findByIdAndUpdate(found._id, {
      esewaTransactionCode: transaction_code,
    });

    if (!booking)
      return res.redirect(
        `${FRONTEND_URL}/payment/esewa/return?status=failed&bookingId=${found._id}`,
      );

    res.redirect(
      `${FRONTEND_URL}/payment/esewa/return?status=success&bookingId=${booking._id}`,
    );
  } catch (err) {
    console.error("esewaSuccess:", err);
    res.redirect(`${FRONTEND_URL}/payment/esewa/return?status=failed`);
  }
};
