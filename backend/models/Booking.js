import mongoose from "mongoose";

export const BOOKING_STATUS = {
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

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Price breakdown — stored separately so we can show the split on receipts
    vehicleCost: { type: Number, default: 0 },
    driverCost: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    // Stored at booking creation — used for consistent fine calculation at return
    mode: { type: String, enum: ["hourly", "daily"], default: "hourly" },
    vehicleDailyRate: { type: Number, default: 0 }, // pricePerHour × 24 × discount
    driverDailyRate: { type: Number, default: 0 }, // driverRatePerHour × 8

    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING_DRIVER,
    },

    notes: { type: String, default: "" },

    rejectedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Payment
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

    // Pre-trip photos (optional)
    preTrip: {
      photos: { type: [String], default: [] },
      submittedAt: { type: Date, default: null },
    },

    // Post-trip
    postTrip: {
      submittedAt: { type: Date, default: null },
    },

    // Fine breakdown
    vehicleFine: { type: Number, default: 0 },
    driverFine: { type: Number, default: 0 },
    fine: { type: Number, default: 0 }, // vehicleFine + driverFine

    returnedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
