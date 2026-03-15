import express from 'express';
import { auth, driver } from '../middleware/auth.js';
import { getDriverProfile, updateAvailability } from '../controllers/driverController.js';

const router = express.Router();

// All routes below require authentication and DRIVER role
router.use(auth, driver);

// GET /api/drivers/me – fetch current driver's profile and availability
router.get('/me', getDriverProfile);

// PATCH /api/drivers/availability – toggle driver online/offline status
router.patch('/availability', updateAvailability);

export default router;