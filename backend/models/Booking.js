import mongoose from "mongoose";

export const BOOKING_STATUS = {
  PENDING_PAYMENT: "PendingPayment",
  PENDING_DRIVER: "PendingDriver",
  CONFIRMED: "Confirmed",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
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

    requiresDriver: { type: Boolean, default: true },

    pickupType: { type: String, enum: ["self", "delivery"], default: "self" },
    pickupLocation: { type: String, default: "" },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    vehicleCost: { type: Number, default: 0 },
    driverCost: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    mode: { type: String, enum: ["hourly", "daily"], default: "hourly" },
    vehicleDailyRate: { type: Number, default: 0 },
    driverDailyRate: { type: Number, default: 0 },

    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING_DRIVER,
    },

    notes: { type: String, default: "" },
    rejectedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
    },
    paymentMethod: {
      type: String,
      enum: ["Card", "Wallet", "Bank", "Cash", "eSewa", null],
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

    preTrip: {
      photos: { type: [String], default: [] },
      submittedAt: { type: Date, default: null },
    },
    postTrip: {
      submittedAt: { type: Date, default: null },
    },

    vehicleFine: { type: Number, default: 0 },
    driverFine: { type: Number, default: 0 },
    fine: { type: Number, default: 0 },
    returnedAt: { type: Date, default: null },

    // ── eSewa ──
    esewaTransactionUuid: { type: String, default: null },
    esewaTransactionCode: { type: String, default: null },
  },
  { timestamps: true },
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
