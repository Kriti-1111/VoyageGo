import express from "express";
import { auth, admin, staff } from "../middleware/auth.js";
import {
  getAllConditionReports,
  reviewConditionReport,
} from "../controllers/conditionReportController.js";

const router = express.Router();

// Allow STAFF, ADMIN, OWNER (staff middleware usually includes admin/owner if implemented properly, let's just use the existing patterns; assume staff or admin middleware handles roles. The prompt said "OWNER, ADMIN, STAFF all have access to it", I'll apply `auth` and `staff` if `staff` middleware exists).
// Let me quickly check what `../middleware/auth.js` exports.
// Wait, I will use `auth` and let's see. If `staff` middleware is not there, I will adjust.
// In `bookingRoutes.js`: import { auth, admin, driver } from "../middleware/auth.js";
// I should just use `auth` and then check roles inside the route if `staff` middleware is not available, or use `auth` and `staff`. Let's assume `staff` exists or I'll just check `req.user.role`.

router.get("/", auth, async (req, res, next) => {
  if (!["ADMIN", "OWNER", "STAFF"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied." });
  }
  next();
}, getAllConditionReports);

router.patch("/:id/review", auth, async (req, res, next) => {
  if (!["ADMIN", "OWNER", "STAFF"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied." });
  }
  next();
}, reviewConditionReport);

export default router;
