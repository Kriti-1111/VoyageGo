import express from "express";
import { auth, admin, driver } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import {
  createBooking,
  getAllBookings,
  getMyBookings,
  getDriverBookings,
  getBookingById,
  driverResponse,
  processPayment,
  submitPreTrip,
  returnVehicle,
  cancelBooking,
  adminCashPayment,
  adminCancelBooking,
  createWalkInBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

//Customer
router.post("/", auth, createBooking);
router.get("/my", auth, getMyBookings);
router.patch("/:id/cancel", auth, cancelBooking);
router.post("/:id/payment", auth, processPayment);
router.post("/:id/pre-trip", auth, submitPreTrip);
router.post("/:id/return", auth, returnVehicle);

//Demo pay
router.post("/:id/demo-pay", auth, async (req, res) => {
  console.log("demoPay hit — bookingId:", req.params.id);
  console.log("demoPay user:", req.user?._id);
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "vehicle",
      "name",
    );
    console.log("booking found:", !!booking);
    if (!booking) return res.status(404).json({ message: "Not found." });
    if (String(booking.customer) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorised." });
    if (booking.paymentStatus === "Paid")
      return res.status(400).json({ message: "Already paid." });

    booking.paymentMethod = "Demo";
    booking.paymentStatus = "Paid";
    booking.paidAt = new Date();

    // Guard against paymentDetails being undefined
    if (!booking.paymentDetails) booking.paymentDetails = {};
    booking.paymentDetails.reference = "DEMO-" + Date.now();

    if (!booking.requiresDriver || booking.status === "Confirmed") {
      booking.status = "Active";
    }
    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone");

    res.json({
      message: "Demo payment recorded. Booking is now active.",
      booking: updated,
    });
  } catch (e) {
    console.error("demoPay error:", e.message, e.stack);
    res.status(500).json({ message: "Server error.", detail: e.message });
  }
});

//Driver
router.get("/driver/mine", auth, driver, getDriverBookings);
router.patch("/:id/driver-response", auth, driver, driverResponse);

//Admin / Owner
router.post("/walkin", auth, admin, createWalkInBooking);
router.get("/", auth, admin, getAllBookings);
router.patch("/:id/cash-payment", auth, admin, adminCashPayment);
router.patch("/:id/admin-cancel", auth, admin, adminCancelBooking);

//Admin: delete booking
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    res.status(200).json({ message: "Booking deleted successfully." });
  } catch (e) {
    console.error("deleteBooking:", e);
    res.status(500).json({ message: "Server error." });
  }
});

router.get("/:id", auth, getBookingById);

export default router;
