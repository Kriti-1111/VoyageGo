import express from "express";
import { auth } from "../middleware/auth.js";
import {
  esewaInitiate,
  esewaAdminInitiate,
  esewaSuccess,
  esewaFineInitiate,
  esewaFineSuccess,
  demoPay,
  demoFinePay,
  walkinCashPay,
} from "../controllers/paymentController.js";

const router = express.Router();

//eSewa booking
router.post("/esewa/initiate", auth, esewaInitiate);
router.post("/esewa/admin-initiate", auth, esewaAdminInitiate);
router.get("/esewa/success", esewaSuccess); // eSewa browser redirect (no auth)

//eSewa fine
router.post("/esewa/fine/initiate", auth, esewaFineInitiate);
router.get("/esewa/fine/success", esewaFineSuccess); // eSewa browser redirect (no auth)

//Demo pay
router.post("/demo", auth, demoPay);
router.post("/demo/fine", auth, demoFinePay);

//Walk In Cash Pay
router.post("/walkin/cash", auth, walkinCashPay);

export default router;
