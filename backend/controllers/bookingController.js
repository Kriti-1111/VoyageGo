import Booking, { BOOKING_STATUS, PAYMENT_STATUS } from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import Notification, { NOTIF_TYPES } from "../models/Notification.js";
import bcrypt from "bcrypt";

// ── Notification helper ───────────────────────────────────────────────────────
async function notify({ recipient, type, title, message, booking }) {
  try {
    await Notification.create({ recipient, type, title, message, booking });
  } catch (e) {
    console.error("notify() silent fail:", e.message);
  }
}

// ── Price calculation ─────────────────────────────────────────────────────────
// Returns { vehicleCost, driverCost, total } or null if invalid duration.
//
// Vehicle pricing:
//   Hourly (1–23h):  hours × pricePerHour                    (no discount)
//   Daily  (1–6d):   days × pricePerHour × 24 × 0.80         (20% off)
//   Weekly (7–30d):  days × pricePerHour × 24 × 0.70         (30% off)
//
// Driver pricing (only when driver assigned):
//   Hourly:  hours × driverRatePerHour
//   Daily:   days × (driverRatePerHour × 8)   (8 working hours assumed)
//
// ── Pricing engine ────────────────────────────────────────────────────────────
//
// mode: "hourly" | "daily"
//
// Hourly:
//   totalHours = ceil(diffHours)
//   vehicleCost = totalHours × pricePerHour
//   driverCost  = totalHours × driverRatePerHour
//
// Daily:
//   totalHours = ceil(diffHours)
//   totalDays  = ceil(totalHours / 24)
//   vehicleDailyRate = pricePerHour × 24 × (0.8 if days ≤6, else 0.7)
//   driverDailyRate  = driverRatePerHour × 8
//   vehicleCost = totalDays × vehicleDailyRate
//   driverCost  = totalDays × driverDailyRate
//
// Returns all intermediate values so fine calculation can reuse daily rates.
//
export function calculatePrice(
  pricePerHour,
  startDate,
  endDate,
  driverRatePerHour = 0,
  mode = "hourly",
) {
  const diffMs = new Date(endDate) - new Date(startDate);
  const rawHours = diffMs / (1000 * 60 * 60);
  const totalHours = Math.ceil(rawHours);
  const totalDays = Math.ceil(totalHours / 24);

  if (rawHours < 1 || rawHours > 30 * 24) return null;

  const dailyBase = pricePerHour * 24;
  const vehicleDailyRate = totalDays <= 6 ? dailyBase * 0.8 : dailyBase * 0.7;
  const driverDailyRate = driverRatePerHour * 8;

  let vehicleCost = 0;
  let driverCost = 0;

  if (mode === "hourly") {
    vehicleCost = Math.round(totalHours * pricePerHour);
    driverCost =
      driverRatePerHour > 0 ? Math.round(totalHours * driverRatePerHour) : 0;
  } else {
    vehicleCost = Math.round(totalDays * vehicleDailyRate);
    driverCost =
      driverRatePerHour > 0 ? Math.round(totalDays * driverDailyRate) : 0;
  }

  return {
    vehicleCost,
    driverCost,
    total: vehicleCost + driverCost,
    // Preserved for fine calculation at return time
    vehicleDailyRate: Math.round(vehicleDailyRate),
    driverDailyRate: Math.round(driverDailyRate),
    totalHours,
    totalDays,
    mode,
  };
}

// ── Fine calculation ──────────────────────────────────────────────────────────
//
// Needs vehicleDailyRate and driverDailyRate from the original booking
// (stored at creation time) so discount is applied consistently.
//
// Grace period: ≤ 30 min → no fine
// 1–6 late hours: lateHours × hourly rate
// > 6 late hours: one full daily rate (vehicle + driver)
//
export function calculateFine(
  pricePerHour,
  driverRatePerHour = 0,
  scheduledEnd,
  actualReturn,
  vehicleDailyRate = null,
  driverDailyRate = null,
) {
  const delayMs = new Date(actualReturn) - new Date(scheduledEnd);
  const delayMins = delayMs / (1000 * 60);

  if (delayMins <= 30)
    return { vehicleFine: 0, driverFine: 0, total: 0, lateHours: 0 };

  const lateHours = Math.ceil(delayMins / 60);

  // Fall back to calculating daily rates if not stored on booking (backwards compat)
  const vDailyRate = vehicleDailyRate || Math.round(pricePerHour * 24 * 0.8);
  const dDailyRate = driverDailyRate || Math.round(driverRatePerHour * 8);

  const vehicleFine =
    lateHours > 6 ? vDailyRate : Math.round(lateHours * pricePerHour);

  const driverFine =
    driverRatePerHour > 0
      ? lateHours > 6
        ? dDailyRate
        : Math.round(lateHours * driverRatePerHour)
      : 0;

  return {
    vehicleFine,
    driverFine,
    total: vehicleFine + driverFine,
    lateHours,
  };
}

// ── Auto-assign driver ────────────────────────────────────────────────────────
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

// ── Auto-activate ─────────────────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Create booking
// POST /api/bookings
//
// requiresDriver = false → Self-drive → status: PendingPayment (no driver flow)
// requiresDriver = true  → With driver → assign driver → status: PendingDriver
// ─────────────────────────────────────────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const {
      vehicleId,
      startDate,
      endDate,
      notes,
      driverId,
      mode = "hourly",
      requiresDriver = true, // NEW: false = self-drive
      pickupType = "self", // NEW: "self" | "delivery"
      pickupLocation = "", // NEW: address if delivery
      customerId, // NEW: for walk-in bookings by admin
    } = req.body;

    if (!["hourly", "daily"].includes(mode)) {
      return res
        .status(400)
        .json({ message: 'mode must be "hourly" or "daily".' });
    }
    if (!vehicleId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "vehicleId, startDate, and endDate are required." });
    }
    if (pickupType === "delivery" && !pickupLocation.trim()) {
      return res
        .status(400)
        .json({
          message: "Delivery address is required for delivery bookings.",
        });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start)
      return res
        .status(400)
        .json({ message: "End date must be after start date." });

    const vehicle = await Vehicle.findById(vehicleId).populate("drivers");
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });
    if (!vehicle.isActive)
      return res
        .status(400)
        .json({ message: "This vehicle is not available." });

    // Vehicle conflict check — include PendingPayment in active statuses
    const vehicleConflict = await Booking.findOne({
      vehicle: vehicleId,
      status: {
        $in: [
          BOOKING_STATUS.PENDING_PAYMENT,
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

    let assignedDriver = null;
    let driverRatePerHour = 0;

    if (requiresDriver) {
      // ── With-driver flow ─────────────────────────────────────────────────────
      const driverPool = (vehicle.drivers || []).map((d) => d._id || d);

      if (driverId) {
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
        assignedDriver = await findAvailableDriver(driverPool, start, end);
        if (!assignedDriver) {
          return res
            .status(400)
            .json({
              message:
                "No drivers available for this time. Choose a different time or select a driver manually.",
            });
        }
      }

      if (assignedDriver) {
        const driverDoc =
          await User.findById(assignedDriver).select("driverRatePerHour");
        driverRatePerHour = driverDoc?.driverRatePerHour || 0;
      }
    }
    // Self-drive: assignedDriver stays null, driverRatePerHour stays 0

    // Price calculation — driver rate is 0 for self-drive
    const pricing = calculatePrice(
      vehicle.pricePerHour,
      start,
      end,
      driverRatePerHour,
      mode,
    );
    if (!pricing) {
      return res
        .status(400)
        .json({
          message: "Invalid booking duration. Min 1 hour, max 30 days.",
        });
    }

    // ── Initial status ────────────────────────────────────────────────────────
    // Self-drive      → PendingPayment (go straight to payment, no driver step)
    // With driver assigned → PendingDriver (driver must accept first)
    // With driver, none available on vehicle → PendingPayment (treat as self-drive)
    let initialStatus;
    if (!requiresDriver) {
      initialStatus = BOOKING_STATUS.PENDING_PAYMENT;
    } else if (assignedDriver) {
      initialStatus = BOOKING_STATUS.PENDING_DRIVER;
    } else {
      // requiresDriver=true but no drivers on vehicle — go straight to payment
      initialStatus = BOOKING_STATUS.PENDING_PAYMENT;
    }

    let finalCustomerId = req.user._id;
    if (["ADMIN", "OWNER", "STAFF"].includes(req.user.role) && customerId) {
      finalCustomerId = customerId;
    }

    const booking = await Booking.create({
      customer: finalCustomerId,
      vehicle: vehicleId,
      driver: assignedDriver,
      requiresDriver: Boolean(requiresDriver),
      pickupType,
      pickupLocation: pickupType === "delivery" ? pickupLocation.trim() : "",
      startDate: start,
      endDate: end,
      mode: pricing.mode,
      vehicleCost: pricing.vehicleCost,
      driverCost: pricing.driverCost,
      totalPrice: pricing.total,
      vehicleDailyRate: pricing.vehicleDailyRate,
      driverDailyRate: pricing.driverDailyRate,
      notes: notes || "",
      status: initialStatus,
    });

    const populated = await Booking.findById(booking._id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone driverRatePerHour");

    res.status(201).json(populated);
  } catch (error) {
    console.error("createBooking:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Create Walk-in Booking
// POST /api/bookings/walkin
// ─────────────────────────────────────────────────────────────────────────────
export const createWalkInBooking = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      vehicleId,
      startDate,
      endDate,
      notes,
      driverId,
      mode = "hourly",
      requiresDriver = true,
      pickupType = "self",
      pickupLocation = "",
      paymentMethod = "Cash",
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required for a walk-in customer." });
    }
    
    if (!["hourly", "daily"].includes(mode)) {
      return res.status(400).json({ message: 'mode must be "hourly" or "daily".' });
    }
    
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({ message: "vehicleId, startDate, and endDate are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start)
      return res.status(400).json({ message: "End date must be after start date." });

    const vehicle = await Vehicle.findById(vehicleId).populate("drivers");
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });
    if (!vehicle.isActive)
      return res.status(400).json({ message: "This vehicle is not available." });

    // Vehicle conflict check
    const vehicleConflict = await Booking.findOne({
      vehicle: vehicleId,
      status: {
        $in: [
          BOOKING_STATUS.PENDING_PAYMENT,
          BOOKING_STATUS.PENDING_DRIVER,
          BOOKING_STATUS.CONFIRMED,
          BOOKING_STATUS.ACTIVE,
        ],
      },
      startDate: { $lt: end },
      endDate: { $gt: start },
    });
    if (vehicleConflict) {
      return res.status(409).json({ message: "Vehicle is already booked for this time period." });
    }

    let assignedDriver = null;
    let driverRatePerHour = 0;

    if (requiresDriver) {
      const driverPool = (vehicle.drivers || []).map((d) => d._id || d);
      if (driverId) {
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
          return res.status(409).json({ message: "The selected driver is not available for this time." });
        }
        assignedDriver = driverId;
      } else if (driverPool.length > 0) {
        assignedDriver = await findAvailableDriver(driverPool, start, end);
        if (!assignedDriver) {
          return res.status(400).json({ message: "No drivers available for this time. Choose a different time or select a driver manually." });
        }
      }

      if (assignedDriver) {
        const driverDoc = await User.findById(assignedDriver).select("driverRatePerHour");
        driverRatePerHour = driverDoc?.driverRatePerHour || 0;
      }
    }

    const pricing = calculatePrice(
      vehicle.pricePerHour,
      start,
      end,
      driverRatePerHour,
      mode,
    );
    if (!pricing) {
      return res.status(400).json({ message: "Invalid booking duration." });
    }

    // 1. Get or Create Guest Customer
    const guestEmail = email || `walkin_${Date.now()}@voyagego.local`;
    let guestUser = await User.findOne({ email: guestEmail });
    
    if (!guestUser) {
      const tempPassword = await bcrypt.hash(`walkin_${Date.now()}`, 10);
      guestUser = await User.create({
        name,
        phone,
        email: guestEmail,
        password: tempPassword,
        role: "CUSTOMER",
        isWalkIn: true
      });
    }

    let initialStatus = BOOKING_STATUS.PENDING_PAYMENT;
    if (requiresDriver) {
       initialStatus = BOOKING_STATUS.PENDING_DRIVER;
    }

    const booking = await Booking.create({
      customer: guestUser._id,
      vehicle: vehicleId,
      driver: assignedDriver,
      requiresDriver: Boolean(requiresDriver),
      pickupType,
      pickupLocation: pickupType === "delivery" ? pickupLocation.trim() : "",
      startDate: start,
      endDate: end,
      mode: pricing.mode,
      vehicleCost: pricing.vehicleCost,
      driverCost: pricing.driverCost,
      totalPrice: pricing.total,
      vehicleDailyRate: pricing.vehicleDailyRate,
      driverDailyRate: pricing.driverDailyRate,
      notes: notes || "",
      status: initialStatus,
      paymentMethod: null,
      paymentStatus: PAYMENT_STATUS.UNPAID,
      paidAt: null
    });

    const populated = await Booking.findById(booking._id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone driverRatePerHour");

    res.status(201).json(populated);
  } catch (error) {
    console.error("createWalkInBooking:", error);
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

      await tryAutoActivate(booking);
    } else {
      // Reject — try reassign
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
      .populate("driver", "name email phone driverRatePerHour");

    res
      .status(200)
      .json({
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
// CUSTOMER: Submit payment → Paid → auto-activates
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

    // Accept payment for both:
    // - PendingPayment: self-drive bookings waiting for payment
    // - Confirmed: with-driver bookings where driver already accepted
    const payableStatuses = [
      BOOKING_STATUS.PENDING_PAYMENT,
      BOOKING_STATUS.CONFIRMED,
    ];
    if (!payableStatuses.includes(booking.status)) {
      return res
        .status(400)
        .json({ message: "Payment cannot be submitted at this stage." });
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

    await notify({
      recipient: booking.customer,
      type: NOTIF_TYPES.PAYMENT_SUCCESS,
      title: "Payment successful",
      message: `Your payment of Rs ${booking.totalPrice.toLocaleString()} has been received.`,
      booking: booking._id,
    });

    if (
      !booking.requiresDriver ||
      booking.status === BOOKING_STATUS.PENDING_PAYMENT
    ) {
      // ── Self-drive: payment → Active immediately (no driver step needed) ──────
      booking.status = BOOKING_STATUS.ACTIVE;
      await booking.save();
      await notify({
        recipient: booking.customer,
        type: NOTIF_TYPES.BOOKING_ACTIVE,
        title: "Booking confirmed and active",
        message: `Your self-drive booking for ${booking.vehicle?.name || "the vehicle"} is active. See you at pickup!`,
        booking: booking._id,
      });
    } else {
      // ── With-driver (Confirmed + Paid) → tryAutoActivate ─────────────────────
      await booking.save();
      await tryAutoActivate(booking);
    }

    const updated = await Booking.findById(id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone driverRatePerHour");

    res
      .status(200)
      .json({
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

    const booking = await Booking.findById(id)
      .populate("vehicle", "pricePerHour name plateNumber")
      .populate("driver", "driverRatePerHour");

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
    const vehicleRate = booking.vehicle?.pricePerHour || 0;
    const driverRate = booking.driver?.driverRatePerHour || 0;
    // Use stored daily rates so fine uses the same discount as the original booking
    const fineBreakdown = calculateFine(
      vehicleRate,
      driverRate,
      booking.endDate,
      now,
      booking.vehicleDailyRate,
      booking.driverDailyRate,
    );
    const delayMins = Math.max(
      0,
      (now - new Date(booking.endDate)) / (1000 * 60),
    );

    booking.vehicleFine = fineBreakdown.vehicleFine;
    booking.driverFine = fineBreakdown.driverFine;
    booking.fine = fineBreakdown.total;
    // NOTE: totalPrice is NOT increased here — fine is collected separately via gateway
    booking.returnedAt = now;
    booking.postTrip.submittedAt = now;
    booking.status = BOOKING_STATUS.COMPLETED;
    // If fine exists, mark it as unpaid — customer must pay via gateway
    if (fineBreakdown.total > 0) {
      booking.finePaid = false;
      booking.finePaidAt = null;
      booking.finePaidVia = null;
    } else {
      booking.finePaid = true; // no fine = no payment needed
    }
    await booking.save();

    await notify({
      recipient: booking.customer,
      type: NOTIF_TYPES.BOOKING_COMPLETED,
      title: "Trip completed",
      message:
        fineBreakdown.total > 0
          ? `Trip completed. A late return fine of Rs ${fineBreakdown.total.toLocaleString()} was applied. Final total: Rs ${booking.totalPrice.toLocaleString()}.`
          : `Trip completed. Thank you for returning on time! Total: Rs ${booking.totalPrice.toLocaleString()}.`,
      booking: booking._id,
    });

    const updated = await Booking.findById(id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name type model plateNumber pricePerHour imageUrl")
      .populate("driver", "name email phone driverRatePerHour");

    res.status(200).json({
      message:
        fineBreakdown.total > 0
          ? "Vehicle returned late. Fine applied."
          : "Vehicle returned on time.",
      fine: fineBreakdown.total,
      vehicleFine: fineBreakdown.vehicleFine,
      driverFine: fineBreakdown.driverFine,
      lateHours: fineBreakdown.lateHours,
      delayMins: Math.round(delayMins),
      // Driver's total earning for their dashboard
      driverEarning:
        (booking.driverCost || 0) + (fineBreakdown.driverFine || 0),
      booking: updated,
    });
  } catch (error) {
    console.error("returnVehicle:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER: Optional pre-trip photos
// POST /api/bookings/:id/pre-trip
// ─────────────────────────────────────────────────────────────────────────────
export const submitPreTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos, damageFlagged, damageNote } = req.body;

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

    if (!booking.preTrip?.submittedAt) {
      booking.preTrip.photos = photos;
      booking.preTrip.submittedAt = new Date();
    } else {
      booking.postTrip.photos = photos;
      booking.postTrip.submittedAt = new Date();
    }

    if (damageFlagged) {
      booking.damageFlagged = true;
      booking.damageFlaggedBy = "customer";
      booking.damageNote = damageNote || "";
    }

    await booking.save();

    res.status(200).json({ message: "Condition report submitted.", booking });
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
      ![
        BOOKING_STATUS.PENDING_PAYMENT,
        BOOKING_STATUS.PENDING_DRIVER,
        BOOKING_STATUS.CONFIRMED,
      ].includes(booking.status)
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
// ADMIN: Cash payment for walk-in
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
      .populate("driver", "name email phone driverRatePerHour");

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
      .populate("driver", "name email phone driverRatePerHour")
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
      .populate("driver", "name email phone driverRatePerHour")
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
      .populate("driver", "name email phone driverRatePerHour");

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
