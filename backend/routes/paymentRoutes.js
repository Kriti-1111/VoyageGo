import express from "express";
import { auth } from "../middleware/auth.js";
import {
  esewaInitiate,
  esewaSuccess,
} from "../controllers/paymentController.js";

const router = express.Router();

// eSewa
router.post("/esewa/initiate", auth, esewaInitiate); // called from frontend, needs auth
router.get("/esewa/success", esewaSuccess); // eSewa browser redirect, no auth

export default router;
