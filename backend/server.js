import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection - Fixed for Mongoose v6+
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/voyagego",
      {
        // Note: use 127.0.0.1 instead of localhost on Windows sometimes
        serverSelectionTimeoutMS: 5000,
      },
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    console.log(
      "Please make sure MongoDB is running. You can install it from:",
    );
    console.log("https://www.mongodb.com/try/download/community");
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "VoyageGo Backend is running",
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const status = dbStatus === 1 ? "healthy" : "unhealthy";

  res.json({
    status,
    database: dbStatus === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
