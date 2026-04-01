import mongoose from "mongoose";

export const NOTIF_TYPES = {
  DRIVER_ACCEPTED: "DRIVER_ACCEPTED", // driver accepted → pay now
  DRIVER_REJECTED: "DRIVER_REJECTED", // driver rejected → reassigning or cancelled
  NO_DRIVER: "NO_DRIVER", // no drivers available → cancelled
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS", // payment confirmed → booking active
  BOOKING_ACTIVE: "BOOKING_ACTIVE", // booking is now active
  BOOKING_COMPLETED: "BOOKING_COMPLETED", // trip completed
  BOOKING_CANCELLED: "BOOKING_CANCELLED", // booking cancelled
};

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: Object.values(NOTIF_TYPES), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
