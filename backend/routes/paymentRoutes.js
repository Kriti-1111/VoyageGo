import express from "express";
import { auth } from "../middleware/auth.js";
import {
  esewaInitiate,
  esewaAdminInitiate,
  esewaSuccess,
  esewaFineInitiate,
  esewaFineSuccess,
  khaltiInitiate,
  khaltiVerify,
  khaltiFinInitiate,
  khaltiFinVerify,
  demoPay,
  demoFinePay,
  walkinCashPay,
} from "../controllers/paymentController.js";

const router = express.Router();

// ── eSewa — booking ───────────────────────────────────────────────────────────
router.post("/esewa/initiate", auth, esewaInitiate);
router.post("/esewa/admin-initiate", auth, esewaAdminInitiate);
router.get("/esewa/success", esewaSuccess); // eSewa browser redirect (no auth)

// ── eSewa — fine ──────────────────────────────────────────────────────────────
router.post("/esewa/fine/initiate", auth, esewaFineInitiate);
router.get("/esewa/fine/success", esewaFineSuccess); // eSewa browser redirect (no auth)

// ── Khalti — booking ──────────────────────────────────────────────────────────
router.post("/khalti/initiate", auth, khaltiInitiate);
router.post("/khalti/verify", auth, khaltiVerify);

// ── Khalti — fine ─────────────────────────────────────────────────────────────
router.post("/khalti/fine/initiate", auth, khaltiFinInitiate);
router.post("/khalti/fine/verify", auth, khaltiFinVerify);

// ── Demo pay (FYP fallback) ───────────────────────────────────────────────────
router.post("/demo", auth, demoPay);
router.post("/demo/fine", auth, demoFinePay);

// ── Walk-in Cash Pay ────────────────────────────────────────────────────────
router.post("/walkin/cash", auth, walkinCashPay);

export default router;
