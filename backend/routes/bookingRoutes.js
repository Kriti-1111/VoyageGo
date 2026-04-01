import express from "express";
import { auth, admin, driver } from "../middleware/auth.js";
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
