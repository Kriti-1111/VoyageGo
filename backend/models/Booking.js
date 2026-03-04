import mongoose from 'mongoose';

// ─── BOOKING STATUS ENUM ──────────────────────────────────────────────────────
export const BOOKING_STATUS = {
  PENDING:   'Pending',
  ACCEPTED:  'Accepted',
  ACTIVE:    'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    notes: {
      type: String,
      default: '',
    },
    // For the reporting / damage evidence feature (Phase 2)
    preTrip: {
      photos:       { type: [String], default: [] },
      fuelLevel:    { type: String,   default: '' },
      odometerRead: { type: Number,   default: 0  },
      submittedAt:  { type: Date,     default: null },
    },
    postTrip: {
      photos:      { type: [String], default: [] },
      fuelLevel:   { type: String,   default: '' },
      submittedAt: { type: Date,     default: null },
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
