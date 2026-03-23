import Booking, { BOOKING_STATUS } from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";

// ─── VALID STATUS TRANSITIONS ─────────────────────────────────────────────────
const TRANSITIONS = {
  DRIVER: {
    [BOOKING_STATUS.PENDING]: [
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.CANCELLED,
    ],
  },
  ADMIN: {
    [BOOKING_STATUS.PENDING]: [
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.CANCELLED,
    ],
    [BOOKING_STATUS.ACCEPTED]: [
      BOOKING_STATUS.ACTIVE,
      BOOKING_STATUS.CANCELLED,
    ],
    [BOOKING_STATUS.ACTIVE]: [
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CANCELLED,
    ],
  },
  OWNER: {
    [BOOKING_STATUS.PENDING]: [
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.CANCELLED,
    ],
    [BOOKING_STATUS.ACCEPTED]: [
      BOOKING_STATUS.ACTIVE,
      BOOKING_STATUS.CANCELLED,
    ],
    [BOOKING_STATUS.ACTIVE]: [
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CANCELLED,
    ],
  },
  CUSTOMER: {
    [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CANCELLED],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Create a new booking (status = Pending)
// POST /api/bookings
// Body: { vehicleId, startDate, endDate, totalPrice, notes, driverId? }
// ─────────────────────────────────────────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, totalPrice, notes, driverId } =
      req.body;

    // 1. Validate required fields
    if (!vehicleId || !startDate || !endDate || !totalPrice) {
      return res
        .status(400)
        .json({
          message:
            "vehicleId, startDate, endDate, and totalPrice are required.",
        });
    }

    // 2. Check vehicle exists and is active
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });
    if (!vehicle.isActive)
      return res
        .status(400)
        .json({ message: "This vehicle is currently unavailable." });

    // 3. Check for date conflicts
    const conflict = await Booking.findOne({
      vehicle: vehicleId,
      status: {
        $in: [
          BOOKING_STATUS.PENDING,
          BOOKING_STATUS.ACCEPTED,
          BOOKING_STATUS.ACTIVE,
        ],
      },
      $or: [
        {
          startDate: { $lt: new Date(endDate) },
          endDate: { $gt: new Date(startDate) },
        },
      ],
    });
    if (conflict)
      return res
        .status(409)
        .json({ message: "Vehicle is already booked for this time period." });

    // 4. Resolve driver:
    //    - If customer explicitly picked a driver → use that
    //    - Else fall back to the vehicle's assigned driver
    //    - Else null (vehicle-only booking)
    let resolvedDriver = null;

    if (driverId) {
      // Validate the chosen driver exists and is a verified driver
      const chosenDriver = await User.findOne({
        _id: driverId,
        role: "DRIVER",
        isDriverVerified: true,
      });
      if (!chosenDriver) {
        return res
          .status(400)
          .json({
            message: "Selected driver is not available or not verified.",
          });
      }
      resolvedDriver = driverId;
    } else if (vehicle.assignedDriver) {
      resolvedDriver = vehicle.assignedDriver;
    }

    // 5. Create booking
    const booking = await Booking.create({
      customer: req.user._id,
      vehicle: vehicleId,
      driver: resolvedDriver,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalPrice,
      notes: notes || "",
      status: BOOKING_STATUS.PENDING,
    });

    // 6. Populate for response
    const populated = await Booking.findById(booking._id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone");

    res.status(201).json(populated);
  } catch (error) {
    console.error("createBooking error:", error);
    res.status(500).json({ message: "Server error creating booking." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN/OWNER: Get ALL bookings
// GET /api/bookings
// ─────────────────────────────────────────────────────────────────────────────
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error("getAllBookings error:", error);
    res.status(500).json({ message: "Server error fetching bookings." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Get MY bookings
// GET /api/bookings/my
// ─────────────────────────────────────────────────────────────────────────────
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error("getMyBookings error:", error);
    res.status(500).json({ message: "Server error fetching your bookings." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER: Get bookings assigned to ME
// GET /api/bookings/driver/mine
// ─────────────────────────────────────────────────────────────────────────────
export const getDriverBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ driver: req.user._id })
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error("getDriverBookings error:", error);
    res.status(500).json({ message: "Server error fetching driver bookings." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN/OWNER: Change booking status
// PATCH /api/bookings/:id/status
// ─────────────────────────────────────────────────────────────────────────────
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const role = req.user.role;

    const booking = await Booking.findById(id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    const allowedTransitions = TRANSITIONS[role]?.[booking.status] || [];
    if (!allowedTransitions.includes(status)) {
      return res.status(403).json({
        message: `Cannot move booking from "${booking.status}" to "${status}" as ${role}.`,
      });
    }

    booking.status = status;
    await booking.save();

    const updated = await Booking.findById(id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone");

    res.status(200).json(updated);
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    res.status(500).json({ message: "Server error updating status." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER: Accept or Reject a booking
// PATCH /api/bookings/:id/driver-response
// ─────────────────────────────────────────────────────────────────────────────
export const driverResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ message: 'Action must be "accept" or "reject".' });
    }

    const booking = await Booking.findById(id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    if (String(booking.driver) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this booking." });
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      return res
        .status(400)
        .json({ message: "Can only respond to Pending bookings." });
    }

    booking.status =
      action === "accept" ? BOOKING_STATUS.ACCEPTED : BOOKING_STATUS.CANCELLED;
    await booking.save();

    const updated = await Booking.findById(id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone");

    res.status(200).json({
      message: action === "accept" ? "Booking accepted." : "Booking rejected.",
      booking: updated,
    });
  } catch (error) {
    console.error("driverResponse error:", error);
    res
      .status(500)
      .json({ message: "Server error processing driver response." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get single booking by ID
// GET /api/bookings/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone");

    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    if (
      req.user.role === "CUSTOMER" &&
      String(booking.customer._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Not authorized." });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("getBookingById error:", error);
    res.status(500).json({ message: "Server error." });
  }
};
