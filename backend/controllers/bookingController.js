import Booking, { BOOKING_STATUS, PAYMENT_STATUS } from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import Notification, { NOTIF_TYPES } from "../models/Notification.js";

// ── Silent notification helper ────────────────────────────────────────────────
async function notify({ recipient, type, title, message, booking }) {
  try {
    await Notification.create({ recipient, type, title, message, booking });
  } catch (e) {
    console.error("notify() silent fail:", e.message);
  }
}

// ── Pricing (server-side, never trust client) ─────────────────────────────────
// Hourly 1–23h:  no discount
// Daily  1–6d:   20% off (× 0.80)
// Weekly 7–30d:  30% off (× 0.70)
export function calculatePrice(pricePerHour, startDate, endDate) {
  const diffMs = new Date(endDate) - new Date(startDate);
  const hours = diffMs / (1000 * 60 * 60);
  const days = hours / 24;

  if (hours < 1 || hours > 30 * 24) return null;

  const dailyRate = pricePerHour * 24;
  if (hours <= 23) return Math.round(hours * pricePerHour);
  if (days <= 6) return Math.round(days * dailyRate * 0.8);
  if (days <= 30) return Math.round(days * dailyRate * 0.7);
  return null;
}

// ── Fine calculation ──────────────────────────────────────────────────────────
// Grace period: ≤30 min → no fine
// 1–6 late hrs: lateHours × pricePerHour
// >6 late hrs:  one full daily rate (pricePerHour × 24 × 0.80)
export function calculateFine(pricePerHour, scheduledEnd, actualReturn) {
  const delayMs = new Date(actualReturn) - new Date(scheduledEnd);
  const delayMins = delayMs / (1000 * 60);
  if (delayMins <= 30) return 0;
  const lateHours = Math.ceil(delayMins / 60);
  const dailyRate = pricePerHour * 24 * 0.8;
  if (lateHours > 6) return Math.round(dailyRate);
  return Math.round(lateHours * pricePerHour);
}

// ── Find first available driver from pool ─────────────────────────────────────
async function findAvailableDriver(
  vehicleDrivers,
  startDate,
  endDate,
  excludeIds = [],
) {
  for (const driverId of vehicleDrivers) {
    if (excludeIds.some((id) => String(id) === String(driverId))) continue;
    const conflict = await Booking.findOne({
      driver: driverId,
      status: {
        $in: [
          BOOKING_STATUS.PENDING_DRIVER,
          BOOKING_STATUS.CONFIRMED,
          BOOKING_STATUS.ACTIVE,
        ],
      },
      startDate: { $lt: new Date(endDate) },
      endDate: { $gt: new Date(startDate) },
    });
    if (!conflict) return driverId;
  }
  return null;
}

// ── Auto-activate when driver accepted AND payment paid ───────────────────────
async function tryAutoActivate(booking) {
  if (
    booking.status === BOOKING_STATUS.CONFIRMED &&
    booking.paymentStatus === PAYMENT_STATUS.PAID
  ) {
    booking.status = BOOKING_STATUS.ACTIVE;
    await booking.save();
    await notify({
      recipient: booking.customer,
      type: NOTIF_TYPES.BOOKING_ACTIVE,
      title: "Booking confirmed and active",
      message:
        "Your booking is now active. Your trip starts at the scheduled time.",
      booking: booking._id,
    });
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Create booking
// POST /api/bookings
//
// KEY LOGIC:
//   - Customer explicitly chose a driver → status: PendingDriver (driver must accept)
//   - No driver chosen + vehicle has drivers → auto-assign → status: PendingDriver
//   - No driver chosen + vehicle has NO drivers → status: Confirmed (go straight to payment)
// ─────────────────────────────────────────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, notes, driverId } = req.body;

    if (!vehicleId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "vehicleId, startDate, and endDate are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res
        .status(400)
        .json({ message: "End date must be after start date." });
    }

    const vehicle = await Vehicle.findById(vehicleId).populate("drivers");
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });
    if (!vehicle.isActive)
      return res
        .status(400)
        .json({ message: "This vehicle is not available." });

    // Server-side price calculation
    const totalPrice = calculatePrice(vehicle.pricePerHour, start, end);
    if (!totalPrice) {
      return res
        .status(400)
        .json({
          message: "Invalid booking duration. Min 1 hour, max 30 days.",
        });
    }

    // Vehicle conflict check
    const vehicleConflict = await Booking.findOne({
      vehicle: vehicleId,
      status: {
        $in: [
          BOOKING_STATUS.PENDING_DRIVER,
          BOOKING_STATUS.CONFIRMED,
          BOOKING_STATUS.ACTIVE,
        ],
      },
      startDate: { $lt: end },
      endDate: { $gt: start },
    });
    if (vehicleConflict) {
      return res
        .status(409)
        .json({ message: "Vehicle is already booked for this time period." });
    }

    const driverPool = (vehicle.drivers || []).map((d) => d._id || d);
    let assignedDriver = null;

    if (driverId) {
      // Customer explicitly chose a driver — validate availability
      const driverConflict = await Booking.findOne({
        driver: driverId,
        status: {
          $in: [
            BOOKING_STATUS.PENDING_DRIVER,
            BOOKING_STATUS.CONFIRMED,
            BOOKING_STATUS.ACTIVE,
          ],
        },
        startDate: { $lt: end },
        endDate: { $gt: start },
      });
      if (driverConflict) {
        return res
          .status(409)
          .json({
            message: "The selected driver is not available for this time.",
          });
      }
      assignedDriver = driverId;
    } else if (driverPool.length > 0) {
      // Auto-assign from vehicle's driver pool
      assignedDriver = await findAvailableDriver(driverPool, start, end);
      if (!assignedDriver) {
        return res.status(400).json({
          message:
            "No drivers are available for the selected time. Please choose a different time or select a specific driver.",
        });
      }
    }
    // If driverPool is empty and no driverId → assignedDriver stays null

    // ── KEY: status depends on whether a driver was assigned ─────────────────
    // No driver → Confirmed immediately (skip driver acceptance step, go straight to payment)
    // Driver assigned → PendingDriver (driver must accept before customer pays)
    const initialStatus = assignedDriver
      ? BOOKING_STATUS.PENDING_DRIVER
      : BOOKING_STATUS.CONFIRMED;

    const booking = await Booking.create({
      customer: req.user._id,
      vehicle: vehicleId,
      driver: assignedDriver,
      startDate: start,
      endDate: end,
      totalPrice,
      notes: notes || "",
      status: initialStatus,
    });

    const populated = await Booking.findById(booking._id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone");

    res.status(201).json(populated);
  } catch (error) {
    console.error("createBooking:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER: Accept or Reject
// PATCH /api/bookings/:id/driver-response
// ─────────────────────────────────────────────────────────────────────────────
export const driverResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ message: 'action must be "accept" or "reject".' });
    }

    const booking = await Booking.findById(id)
      .populate("vehicle", "name pricePerHour drivers")
      .populate("driver", "name");

    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    if (
      String(booking.driver?._id || booking.driver) !== String(req.user._id)
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this booking." });
    }
    if (booking.status !== BOOKING_STATUS.PENDING_DRIVER) {
      return res
        .status(400)
        .json({ message: "Can only respond to PendingDriver bookings." });
    }

    const driverName = booking.driver?.name || "Your driver";
    const vehicleName = booking.vehicle?.name || "the vehicle";

    if (action === "accept") {
      booking.status = BOOKING_STATUS.CONFIRMED;
      await booking.save();

      await notify({
        recipient: booking.customer,
        type: NOTIF_TYPES.DRIVER_ACCEPTED,
        title: "Driver accepted — pay to confirm",
        message: `${driverName} accepted your booking for ${vehicleName}. Pay Rs ${booking.totalPrice.toLocaleString()} to activate your trip.`,
        booking: booking._id,
      });

      // If already paid (edge case), auto-activate
      await tryAutoActivate(booking);
    } else {
      // Reject — try to reassign to next available driver
      booking.rejectedDrivers.push(booking.driver);

      const driverPool = (booking.vehicle.drivers || []).map((d) => d._id || d);
      const nextDriver = await findAvailableDriver(
        driverPool,
        booking.startDate,
        booking.endDate,
        [...booking.rejectedDrivers],
      );

      if (nextDriver) {
        booking.driver = nextDriver;
        await booking.save();

        await notify({
          recipient: booking.customer,
          type: NOTIF_TYPES.DRIVER_REJECTED,
          title: "Driver unavailable — reassigning",
          message: `${driverName} could not accept your booking. We've assigned another driver who will review it shortly.`,
          booking: booking._id,
        });
      } else {
        // No more drivers — cancel
        booking.status = BOOKING_STATUS.CANCELLED;
        await booking.save();

        await notify({
          recipient: booking.customer,
          type: NOTIF_TYPES.NO_DRIVER,
          title: "No drivers available",
          message: `We were unable to find a driver for your booking of ${vehicleName}. Please try a different time or vehicle.`,
          booking: booking._id,
        });
      }
    }

    const updated = await Booking.findById(id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone");

    res.status(200).json({
      message:
        action === "accept" ? "Booking accepted." : "Processed rejection.",
      booking: updated,
    });
  } catch (error) {
    console.error("driverResponse:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Submit payment → marks Paid → auto-activates
// POST /api/bookings/:id/payment
// ─────────────────────────────────────────────────────────────────────────────
export const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, last4, provider, reference, bank, transferDate } = req.body;

    if (!["Card", "Wallet", "Bank"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }

    const booking = await Booking.findById(id).populate("vehicle", "name");
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    if (String(booking.customer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorised." });
    }
    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      return res.status(400).json({
        message: "Payment can only be submitted for Confirmed bookings.",
      });
    }
    if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
      return res
        .status(400)
        .json({ message: "This booking has already been paid." });
    }

    booking.paymentMethod = method;
    booking.paymentStatus = PAYMENT_STATUS.PAID;
    booking.paidAt = new Date();
    booking.paymentDetails = {
      last4: last4 || null,
      provider: provider || null,
      reference: reference || null,
      bank: bank || null,
      transferDate: transferDate ? new Date(transferDate) : null,
    };
    await booking.save();

    await notify({
      recipient: booking.customer,
      type: NOTIF_TYPES.PAYMENT_SUCCESS,
      title: "Payment successful",
      message: `Your payment of Rs ${booking.totalPrice.toLocaleString()} has been received.`,
      booking: booking._id,
    });

    // Auto-activate (always true at this point since status is Confirmed + now Paid)
    await tryAutoActivate(booking);

    const updated = await Booking.findById(id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone");

    res.status(200).json({
      message: "Payment successful. Your booking is now active.",
      booking: updated,
    });
  } catch (error) {
    console.error("processPayment:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Return vehicle → Completed
// POST /api/bookings/:id/return
// ─────────────────────────────────────────────────────────────────────────────
export const returnVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate(
      "vehicle",
      "pricePerHour name plateNumber",
    );

    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    if (String(booking.customer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorised." });
    }
    if (booking.status !== BOOKING_STATUS.ACTIVE) {
      return res
        .status(400)
        .json({ message: "Only active trips can be returned." });
    }

    const now = new Date();
    const fine = calculateFine(
      booking.vehicle?.pricePerHour || 0,
      booking.endDate,
      now,
    );
    const delayMins = Math.max(
      0,
      (now - new Date(booking.endDate)) / (1000 * 60),
    );

    booking.fine = fine;
    booking.totalPrice = booking.totalPrice + fine;
    booking.returnedAt = now;
    booking.postTrip.submittedAt = now;
    booking.status = BOOKING_STATUS.COMPLETED;
    await booking.save();

    await notify({
      recipient: booking.customer,
      type: NOTIF_TYPES.BOOKING_COMPLETED,
      title: "Trip completed",
      message:
        fine > 0
          ? `Trip completed. A late return fine of Rs ${fine.toLocaleString()} was applied. Final total: Rs ${booking.totalPrice.toLocaleString()}.`
          : `Trip completed. Thank you for returning on time! Total: Rs ${booking.totalPrice.toLocaleString()}.`,
      booking: booking._id,
    });

    const updated = await Booking.findById(id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone");

    res.status(200).json({
      message:
        fine > 0
          ? "Vehicle returned late. Fine applied."
          : "Vehicle returned on time.",
      fine,
      delayMins: Math.round(delayMins),
      booking: updated,
    });
  } catch (error) {
    console.error("returnVehicle:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Optional pre-trip photos (does NOT block anything)
// POST /api/bookings/:id/pre-trip
// ─────────────────────────────────────────────────────────────────────────────
export const submitPreTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body;

    if (!Array.isArray(photos) || photos.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one photo is required." });
    }

    const booking = await Booking.findById(id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (String(booking.customer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorised." });
    }

    booking.preTrip.photos = photos;
    booking.preTrip.submittedAt = new Date();
    await booking.save();

    res.status(200).json({ message: "Photos uploaded.", booking });
  } catch (error) {
    console.error("submitPreTrip:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Cancel own booking
// PATCH /api/bookings/:id/cancel
// ─────────────────────────────────────────────────────────────────────────────
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    if (String(booking.customer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorised." });
    }
    if (
      ![BOOKING_STATUS.PENDING_DRIVER, BOOKING_STATUS.CONFIRMED].includes(
        booking.status,
      )
    ) {
      return res
        .status(400)
        .json({
          message: "You can only cancel bookings that have not started.",
        });
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    await booking.save();
    res.status(200).json({ message: "Booking cancelled." });
  } catch (error) {
    console.error("cancelBooking:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Cash payment for walk-in customers
// PATCH /api/bookings/:id/cash-payment
// ─────────────────────────────────────────────────────────────────────────────
export const adminCashPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("vehicle", "name");
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    booking.paymentMethod = "Cash";
    booking.paymentStatus = PAYMENT_STATUS.PAID;
    booking.paidAt = new Date();

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      booking.status = BOOKING_STATUS.ACTIVE;
      await notify({
        recipient: booking.customer,
        type: NOTIF_TYPES.BOOKING_ACTIVE,
        title: "Booking activated",
        message: `Your booking for ${booking.vehicle?.name || "the vehicle"} is now active.`,
        booking: booking._id,
      });
    }

    await booking.save();

    const updated = await Booking.findById(id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone");

    res
      .status(200)
      .json({ message: "Cash payment recorded.", booking: updated });
  } catch (error) {
    console.error("adminCashPayment:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Cancel any booking
// PATCH /api/bookings/:id/admin-cancel
// ─────────────────────────────────────────────────────────────────────────────
export const adminCancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (booking.status === BOOKING_STATUS.COMPLETED) {
      return res
        .status(400)
        .json({ message: "Cannot cancel a completed booking." });
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    await booking.save();

    await notify({
      recipient: booking.customer,
      type: NOTIF_TYPES.BOOKING_CANCELLED,
      title: "Booking cancelled",
      message: "Your booking has been cancelled by an admin.",
      booking: booking._id,
    });

    res.status(200).json({ message: "Booking cancelled." });
  } catch (error) {
    console.error("adminCancelBooking:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// READ endpoints
// ─────────────────────────────────────────────────────────────────────────────
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (e) {
    res.status(500).json({ message: "Server error." });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (e) {
    res.status(500).json({ message: "Server error." });
  }
};

export const getDriverBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ driver: req.user._id })
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (e) {
    res.status(500).json({ message: "Server error." });
  }
};

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
      return res.status(403).json({ message: "Not authorised." });
    }

    res.status(200).json(booking);
  } catch (e) {
    res.status(500).json({ message: "Server error." });
  }
};
