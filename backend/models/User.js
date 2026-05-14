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

    // Driver specific
    licenseNo: { type: String },
    languages: [{ type: String }],
    vehicleSpecialization: [{ type: String }],
    isDriverVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false },
    shiftStart: { type: String },
    shiftEnd: { type: String },
    driverRatePerHour: { type: Number, default: 200 },
    profilePhoto: { type: String, default: "" },
    totalRides: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    district: {
      type: String,
      enum: ["Kathmandu", "Lalitpur", "Bhaktapur"],
      default: "Kathmandu",
    },

    // Address
    permanentAddress: String,
    temporaryAddress: String,

    // Walk in Customer
    isWalkIn: { type: Boolean, default: false },

    // Document Verification
    documents: {
      status: {
        type: String,
        enum: ["NotSubmitted", "PendingReview", "Rejected", "Verified"],
        default: "NotSubmitted",
      },
      verificationMethod: {
        type: String,
        enum: ["Online", "InPerson"],
        default: "Online",
      },
      citizenshipFront: { type: String, default: "" },
      citizenshipBack: { type: String, default: "" },
      license: { type: String, default: "" },
      rejectionReason: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
