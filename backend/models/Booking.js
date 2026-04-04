import mongoose from "mongoose";

export const BOOKING_STATUS = {
  PENDING_PAYMENT: "PendingPayment", // Self-drive: waiting for customer to pay
  PENDING_DRIVER: "PendingDriver", // With-driver: waiting for driver to accept
  CONFIRMED: "Confirmed", // Driver accepted (with-driver) — waiting for payment
  ACTIVE: "Active", // Trip in progress
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

    // Self-drive vs with-driver split
    requiresDriver: { type: Boolean, default: true },

    // Pickup: customer collects vehicle, or vehicle delivered to them
    pickupType: { type: String, enum: ["self", "delivery"], default: "self" },
    pickupLocation: { type: String, default: "" }, // only used when pickupType = "delivery"

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Price breakdown
    vehicleCost: { type: Number, default: 0 },
    driverCost: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    // Stored at booking creation for consistent fine calculation
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

    // Payment
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
    },
    paymentMethod: {
      type: String,
      enum: ["Card", "Wallet", "Bank", "Cash", "eSewa", "Khalti", null],
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
    fine: { type: Number, default: 0 },

    returnedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
