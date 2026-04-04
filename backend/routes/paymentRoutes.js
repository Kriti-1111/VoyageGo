import express from "express";
import { auth } from "../middleware/auth.js";
import {
  esewaInitiate,
  esewaVerify,
  khaltiInitiate,
  khaltiVerify,
} from "../controllers/paymentController.js";

const router = express.Router();

// eSewa
router.post("/esewa/initiate", auth, esewaInitiate); // get form params
router.get("/esewa/verify", auth, esewaVerify); // verify after redirect (auth via token in query)

// Khalti
router.post("/khalti/initiate", auth, khaltiInitiate); // get Khalti payment URL
router.post("/khalti/verify", auth, khaltiVerify); // verify after redirect

export default router;
