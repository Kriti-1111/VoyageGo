import express from 'express';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleActive,
} from '../controllers/vehicleController.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (no auth required)
// ─────────────────────────────────────────────────────────────────────────────

// Get all vehicles
// GET /api/vehicles
router.get('/', getAllVehicles);

// Get single vehicle by ID
// GET /api/vehicles/:id
router.get('/:id', getVehicleById);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ONLY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Create new vehicle
// POST /api/vehicles
router.post('/', auth, admin, createVehicle);

// Update vehicle
// PUT /api/vehicles/:id
router.put('/:id', auth, admin, updateVehicle);

// Delete vehicle
// DELETE /api/vehicles/:id
router.delete('/:id', auth, admin, deleteVehicle);

// Toggle vehicle active status (activate/deactivate)
// PATCH /api/vehicles/:id/toggle-active
router.patch('/:id/toggle-active', auth, admin, toggleVehicleActive);

export default router;
