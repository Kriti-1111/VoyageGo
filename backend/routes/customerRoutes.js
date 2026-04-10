import express from "express";
import { auth, admin } from "../middleware/auth.js";
import {
  getAllCustomers,
  getCustomerById,
  deleteCustomer,
} from "../controllers/customerController.js";

const router = express.Router();

router.get("/", auth, admin, getAllCustomers);
router.get("/:id", auth, admin, getCustomerById);
router.delete("/:id", auth, admin, deleteCustomer);

export default router;
