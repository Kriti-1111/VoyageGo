import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true, // e.g. Sedan, SUV, Van
    },
    model: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
      required: true,
    },
    passengerSeat: {
      type: Number,
      required: true,
      min: 1,
    },
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    // isActive = false means admin has deactivated (e.g. in workshop)
    isActive: {
      type: Boolean,
      default: true,
    },
    // Which driver is assigned to this vehicle
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
