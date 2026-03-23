import express from "express";
import { auth, admin, driver } from "../middleware/auth.js";
import {
  getDriverProfile,
  updateAvailability,
  getAllDrivers,
  verifyDriver,
} from "../controllers/driverController.js";

const router = express.Router();

// GET /api/drivers — fetch all drivers (any authenticated user can browse)
router.get("/", auth, getAllDrivers);

// PATCH /api/drivers/:id/verify — Admin verifies or unverifies a driver
router.patch("/:id/verify", auth, admin, verifyDriver);

// Routes below require DRIVER role
router.get("/me", auth, driver, getDriverProfile);
router.patch("/availability", auth, driver, updateAvailability);

export default router;
