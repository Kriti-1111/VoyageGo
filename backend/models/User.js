import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },

    role: {
      type: String,
      enum: ["CUSTOMER", "DRIVER", "ADMIN", "OWNER", "STAFF"],
      default: "CUSTOMER",
    },

    // Driver-specific
    licenseNo: { type: String },
    languages: [{ type: String }],
    vehicleSpecialization: [{ type: String }],
    isDriverVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false },
    shiftStart: { type: String },
    shiftEnd: { type: String },

    // Address
    permanentAddress: String,
    temporaryAddress: String,
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
