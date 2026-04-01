import express from "express";
import { auth, admin } from "../middleware/auth.js";
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleActive,
  updateVehicleDrivers,
} from "../controllers/vehicleController.js";

const router = express.Router();

// Public
router.get("/", getAllVehicles);
router.get("/:id", getVehicleById);

// Admin only
router.post("/", auth, admin, createVehicle);
router.put("/:id", auth, admin, updateVehicle);
router.patch("/:id", auth, admin, updateVehicle);
router.delete("/:id", auth, admin, deleteVehicle);
router.patch("/:id/toggle", auth, admin, toggleVehicleActive);
router.patch("/:id/drivers", auth, admin, updateVehicleDrivers); // ← was missing

export default router;
