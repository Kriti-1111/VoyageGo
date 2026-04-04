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
} from "../controllers/bookingController.js";

const router = express.Router();

// ── Customer ──────────────────────────────────────────────────────────────────
router.post("/", auth, createBooking); // create (auto-assigns driver)
router.get("/my", auth, getMyBookings);
router.patch("/:id/cancel", auth, cancelBooking); // cancel own pending booking
router.post("/:id/payment", auth, processPayment); // pay → auto-activates
router.post("/:id/pre-trip", auth, submitPreTrip); // optional photos
router.post("/:id/return", auth, returnVehicle); // Active → Completed

// ── Demo pay — FYP fallback when eSewa sandbox is down ────────────────────────
// Simulates what happens after eSewa verifies: marks booking Paid + Active.
// The full eSewa HMAC + verification flow is implemented in paymentController.js
router.post("/:id/demo-pay", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "vehicle",
      "name",
    );
    if (!booking) return res.status(404).json({ message: "Not found." });
    if (String(booking.customer) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorised." });
    if (booking.paymentStatus === "Paid")
      return res.status(400).json({ message: "Already paid." });

    booking.paymentMethod = "eSewa";
    booking.paymentStatus = "Paid";
    booking.paidAt = new Date();
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
    console.error("demoPay:", e);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Driver ────────────────────────────────────────────────────────────────────
router.get("/driver/mine", auth, driver, getDriverBookings);
router.patch("/:id/driver-response", auth, driver, driverResponse);

// ── Admin / Owner ─────────────────────────────────────────────────────────────
router.get("/", auth, admin, getAllBookings);
router.patch("/:id/cash-payment", auth, admin, adminCashPayment); // cash → Paid + Active
router.patch("/:id/admin-cancel", auth, admin, adminCancelBooking); // cancel any booking

// ── Shared ────────────────────────────────────────────────────────────────────
router.get("/:id", auth, getBookingById);

export default router;
