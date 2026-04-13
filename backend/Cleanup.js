import mongoose from "mongoose";
import Booking from "./models/Booking.js";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.DATABASE_URL);

// Delete all non-eSewa paid bookings
const result = await Booking.deleteMany({
  $or: [
    { paymentMethod: null, paymentStatus: "Paid" }, // demo-pay leftovers
  ],
});

console.log("Deleted:", result.deletedCount, "bookings");

// Also reset any stuck PENDING bookings if you want a clean slate
const reset = await Booking.deleteMany({ paymentStatus: "Unpaid" });
console.log("Cleared unpaid:", reset.deletedCount, "bookings");

await mongoose.disconnect();
process.exit();
