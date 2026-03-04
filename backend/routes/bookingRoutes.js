import express from 'express';
import {
  createBooking,
  getAllBookings,
  getMyBookings,
  getDriverBookings,
  updateBookingStatus,
  driverResponse,
  getBookingById,
} from '../controllers/bookingController.js';
import { auth, admin, driver, customer } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// All routes below require authentication (auth middleware runs first)
// ─────────────────────────────────────────────────────────────────────────────

// CUSTOMER — create a new booking
// POST /api/bookings
router.post('/', auth, createBooking);

// CUSTOMER — view their own bookings
// GET /api/bookings/my
router.get('/my', auth, getMyBookings);

// DRIVER — view bookings assigned to them
// GET /api/bookings/driver/mine
router.get('/driver/mine', auth, getDriverBookings);

// ADMIN — view ALL bookings
// GET /api/bookings
router.get('/', auth, admin, getAllBookings);

// ADMIN — manually change any booking status (override)
// PATCH /api/bookings/:id/status
// Body: { status: 'Accepted' | 'Active' | 'Completed' | 'Cancelled' }
router.patch('/:id/status', auth, admin, updateBookingStatus);

// DRIVER — accept or reject a booking
// PATCH /api/bookings/:id/driver-response
// Body: { action: 'accept' | 'reject' }
router.patch('/:id/driver-response', auth, driverResponse);

// ANY authenticated user — get one booking by ID
// GET /api/bookings/:id
router.get('/:id', auth, getBookingById);

export default router;
