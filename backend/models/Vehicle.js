import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "Sedan",
        "Hatchback",
        "SUV",
        "Electric",
        "Luxury",
        "Offroad",
        "Convertible",
        "Hybrid",
      ],
      required: true,
    },
    model: { type: String, required: true },
    company: { type: String, required: true },
    plateNumber: { type: String, required: true, unique: true },
    pricePerHour: { type: Number, required: true, min: 0 },
    passengerSeat: { type: Number, default: 4 },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "Hybrid"],
      default: "Petrol",
    },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },

    // Drivers assigned to this vehicle (for auto-assignment)
    drivers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
