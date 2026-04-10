import express from "express";
import { auth, admin, driver } from "../middleware/auth.js";
import User from "../models/User.js";
import {
  getDriverProfile,
  updateAvailability,
  getAllDrivers,
  verifyDriver,
} from "../controllers/driverController.js";
import Booking, { BOOKING_STATUS } from "../models/Booking.js";

const router = express.Router();

// Public — guests can browse
router.get("/", getAllDrivers);

// Driver's own profile and availability toggle
router.get("/me", auth, driver, getDriverProfile);
router.patch("/availability", auth, driver, updateAvailability);

// Admin: verify / unverify
router.patch("/:id/verify", auth, admin, verifyDriver);

// ── Driver availability calendar ──────────────────────────────────────────────
// GET /api/drivers/:id/availability
// Returns booked time slots so the frontend can show a read-only calendar.
// Public — no auth needed to view availability.
router.get("/:id/availability", async (req, res) => {
  try {
    const bookings = await Booking.find({
      driver: req.params.id,
      status: {
        $in: [
          BOOKING_STATUS.PENDING_DRIVER,
          BOOKING_STATUS.CONFIRMED,
          BOOKING_STATUS.ACTIVE,
        ],
      },
    }).select("startDate endDate status");

    const slots = bookings.map((b) => ({
      start: b.startDate,
      end: b.endDate,
      status: b.status,
    }));

    res.status(200).json(slots);
  } catch (e) {
    console.error("availability:", e);
    res.status(500).json({ message: "Server error." });
  }
});

// Admin: delete driver
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({
      _id: req.params.id,
      role: "DRIVER",
    });
    if (!deleted) return res.status(404).json({ message: "Driver not found." });
    res.status(200).json({ message: "Driver deleted successfully." });
  } catch (e) {
    console.error("deleteDriver:", e);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;
