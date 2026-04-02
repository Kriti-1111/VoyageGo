import express from "express";
import { auth, admin } from "../middleware/auth.js";
import {
  getAllCustomers,
  getCustomerById,
} from "../controllers/customerController.js";

const router = express.Router();

router.get("/", auth, admin, getAllCustomers);
router.get("/:id", auth, admin, getCustomerById);

export default router;
