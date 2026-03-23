import express from "express";
import {
  register,
  login,
  me,
  getAllCustomers,
} from "../controllers/authController.js";
import { auth, adminOrOwner } from "../middleware/auth.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", auth, me);

// Admin OR Owner — get all customers
// adminOrOwner allows BOTH 'ADMIN' and 'OWNER' roles (fixes OWNER getting 403)
router.get("/customers", auth, adminOrOwner, getAllCustomers);

// Admin only example
router.get("/admin-only", auth, roleMiddleware(["ADMIN"]), (req, res) => {
  res.json({ message: "Admin access granted" });
});

// Driver only example
router.get("/driver-only", auth, roleMiddleware(["DRIVER"]), (req, res) => {
  res.json({ message: "Driver access granted" });
});

export default router;
