import Booking, { BOOKING_STATUS } from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';

// ─── VALID STATUS TRANSITIONS ─────────────────────────────────────────────────
// Defines what status changes are allowed and who can make them.
// This is the core of your booking state machine.
const TRANSITIONS = {
  // role: { fromStatus: [allowedNextStatuses] }
  DRIVER: {
    [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED],
  },
  ADMIN: {
    [BOOKING_STATUS.PENDING]:   [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.ACCEPTED]:  [BOOKING_STATUS.ACTIVE,   BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.ACTIVE]:    [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
  },
  CUSTOMER: {
    [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CANCELLED],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Create a new booking (status = Pending)
// POST /api/bookings
// ─────────────────────────────────────────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, totalPrice, notes } = req.body;

    // 1. Validate required fields
    if (!vehicleId || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({ message: 'vehicleId, startDate, endDate, and totalPrice are required.' });
    }

    // 2. Check vehicle exists and is active
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }
    if (!vehicle.isActive) {
      return res.status(400).json({ message: 'This vehicle is currently unavailable.' });
    }

    // 3. Check for date conflicts — no overlapping bookings for same vehicle
    const conflict = await Booking.findOne({
      vehicle: vehicleId,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ACTIVE] },
      $or: [
        { startDate: { $lt: new Date(endDate) }, endDate: { $gt: new Date(startDate) } },
      ],
    });

    if (conflict) {
      return res.status(409).json({ message: 'Vehicle is already booked for this time period.' });
    }

    // 4. Create booking
    const booking = await Booking.create({
      customer:   req.user._id,
      vehicle:    vehicleId,
      driver:     vehicle.assignedDriver || null,
      startDate:  new Date(startDate),
      endDate:    new Date(endDate),
      totalPrice,
      notes:      notes || '',
      status:     BOOKING_STATUS.PENDING,
    });

    // 5. Populate for response
    const populated = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('vehicle',  'name type model plateNumber pricePerHour imageUrl')
      .populate('driver',   'name email phone');

    res.status(201).json(populated);

  } catch (error) {
    console.error('createBooking error:', error);
    res.status(500).json({ message: 'Server error creating booking.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Get ALL bookings
// GET /api/bookings
// ─────────────────────────────────────────────────────────────────────────────
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email phone')
      .populate('vehicle',  'name type model plateNumber pricePerHour imageUrl')
      .populate('driver',   'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (error) {
    console.error('getAllBookings error:', error);
    res.status(500).json({ message: 'Server error fetching bookings.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Get MY bookings
// GET /api/bookings/my
// ─────────────────────────────────────────────────────────────────────────────
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('vehicle', 'name type model plateNumber pricePerHour imageUrl')
      .populate('driver',  'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (error) {
    console.error('getMyBookings error:', error);
    res.status(500).json({ message: 'Server error fetching your bookings.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER: Get bookings assigned to ME
// GET /api/bookings/driver/mine
// ─────────────────────────────────────────────────────────────────────────────
export const getDriverBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ driver: req.user._id })
      .populate('customer', 'name email phone')
      .populate('vehicle',  'name type model plateNumber pricePerHour imageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (error) {
    console.error('getDriverBookings error:', error);
    res.status(500).json({ message: 'Server error fetching driver bookings.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Change booking status (manual override)
// PATCH /api/bookings/:id/status
// Body: { status: 'Accepted' | 'Active' | 'Completed' | 'Cancelled' }
// ─────────────────────────────────────────────────────────────────────────────
export const updateBookingStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;
    const role       = req.user.role; // ADMIN | DRIVER | CUSTOMER

    // 1. Find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // 2. Check if this role is allowed to make this transition
    const allowedTransitions = TRANSITIONS[role]?.[booking.status] || [];
    if (!allowedTransitions.includes(status)) {
      return res.status(403).json({
        message: `Cannot move booking from "${booking.status}" to "${status}" as ${role}.`,
      });
    }

    // 3. Apply status change
    booking.status = status;
    await booking.save();

    const updated = await Booking.findById(id)
      .populate('customer', 'name email phone')
      .populate('vehicle',  'name type model plateNumber pricePerHour imageUrl')
      .populate('driver',   'name email phone');

    res.status(200).json(updated);

  } catch (error) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ message: 'Server error updating status.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER: Accept or Reject a booking
// PATCH /api/bookings/:id/driver-response
// Body: { action: 'accept' | 'reject' }
// ─────────────────────────────────────────────────────────────────────────────
export const driverResponse = async (req, res) => {
  try {
    const { id }     = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "accept" or "reject".' });
    }

    // 1. Find booking and verify this driver is assigned
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (String(booking.driver) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You are not assigned to this booking.' });
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({ message: 'Can only respond to Pending bookings.' });
    }

    // 2. Apply response
    booking.status = action === 'accept'
      ? BOOKING_STATUS.ACCEPTED
      : BOOKING_STATUS.CANCELLED;

    await booking.save();

    const updated = await Booking.findById(id)
      .populate('customer', 'name email phone')
      .populate('vehicle',  'name type model plateNumber pricePerHour imageUrl')
      .populate('driver',   'name email phone');

    res.status(200).json({
      message: action === 'accept' ? 'Booking accepted.' : 'Booking rejected.',
      booking: updated,
    });

  } catch (error) {
    console.error('driverResponse error:', error);
    res.status(500).json({ message: 'Server error processing driver response.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get single booking by ID
// GET /api/bookings/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('vehicle',  'name type model plateNumber pricePerHour imageUrl')
      .populate('driver',   'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Customers can only see their own bookings
    if (req.user.role === 'CUSTOMER' && String(booking.customer._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    res.status(200).json(booking);

  } catch (error) {
    console.error('getBookingById error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
