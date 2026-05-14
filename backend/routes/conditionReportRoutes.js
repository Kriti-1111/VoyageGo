import express from "express";
import { auth, admin, staff } from "../middleware/auth.js";
import {
  getAllConditionReports,
  reviewConditionReport,
} from "../controllers/conditionReportController.js";

const router = express.Router();

router.get(
  "/",
  auth,
  async (req, res, next) => {
    if (!["ADMIN", "OWNER", "STAFF"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied." });
    }
    next();
  },
  getAllConditionReports,
);

router.patch(
  "/:id/review",
  auth,
  async (req, res, next) => {
    if (!["ADMIN", "OWNER", "STAFF"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied." });
    }
    next();
  },
  reviewConditionReport,
);

export default router;
