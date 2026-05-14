import express from "express";
import { auth, admin, driver } from "../middleware/auth.js";
import User from "../models/User.js";
import {
  getDriverProfile,
  updateAvailability,
  getAllDrivers,
  verifyDriver,
  updateDriverProfile,
  rateDriver,
  updateDriverAdmin,
} from "../controllers/driverController.js";
import Booking, { BOOKING_STATUS } from "../models/Booking.js";

const router = express.Router();

// Public, guests can browse
router.get("/", getAllDrivers);

// Driver's own profile and availability toggle
router.get("/me", auth, driver, getDriverProfile);
router.patch("/profile", auth, driver, updateDriverProfile);
router.patch("/availability", auth, driver, updateAvailability);

// Customer rating
router.post("/:id/rate", auth, rateDriver);

// Admin: verify / unverify
router.patch("/:id/verify", auth, admin, verifyDriver);

// Admin: update details (rate, district)
router.patch("/:id/admin-update", auth, admin, updateDriverAdmin);

//Driver availability calendar
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
