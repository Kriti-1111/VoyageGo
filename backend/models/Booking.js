import mongoose from "mongoose";

export const BOOKING_STATUS = {
  PENDING_DRIVER: "PendingDriver", // waiting for driver to accept
  CONFIRMED: "Confirmed", // driver accepted, waiting for payment
  ACTIVE: "Active", // driver accepted + payment paid → auto-activated
  COMPLETED: "Completed", // vehicle returned
  CANCELLED: "Cancelled", // driver rejected / no drivers / customer cancelled
};

export const PAYMENT_STATUS = {
  UNPAID: "Unpaid",
  PAID: "Paid",
};

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING_DRIVER,
    },

    notes: { type: String, default: "" },

    // Tracks which drivers were tried (for auto-reassignment on reject)
    rejectedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Payment ─────────────────────────────────────────────────────────────────
    // Flow: Unpaid → Paid (instant on gateway confirm / admin cash entry)
    // No PendingApproval step.
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
    },
    paymentMethod: {
      type: String,
      enum: ["Card", "Wallet", "Bank", "Cash", null],
      default: null,
    },
    paymentDetails: {
      last4: { type: String, default: null },
      provider: { type: String, default: null },
      reference: { type: String, default: null },
      bank: { type: String, default: null },
      transferDate: { type: Date, default: null },
    },
    paidAt: { type: Date, default: null },

    // Pre-trip photos (optional — do not block trip start) ────────────────────
    preTrip: {
      photos: { type: [String], default: [] },
      submittedAt: { type: Date, default: null },
    },

    // Post-trip ───────────────────────────────────────────────────────────────
    postTrip: {
      submittedAt: { type: Date, default: null },
    },

    // Fine ────────────────────────────────────────────────────────────────────
    fine: { type: Number, default: 0 },
    returnedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
