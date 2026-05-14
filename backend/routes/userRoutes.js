import express from "express";
import {
  uploadOnlineDocuments,
  verifyWalkInDocuments,
  getPendingDocuments,
  reviewDocuments,
} from "../controllers/userController.js";
import { auth, adminOrOwner } from "../middleware/auth.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Online customer submit documents
router.post("/documents", auth, uploadOnlineDocuments);

// Walk in booking staff verify documents
router.post(
  "/documents/walkin",
  auth,
  roleMiddleware(["ADMIN", "STAFF", "OWNER"]),
  verifyWalkInDocuments,
);

// Admin fetch pending online documents
router.get(
  "/documents/pending",
  auth,
  roleMiddleware(["ADMIN", "STAFF", "OWNER"]),
  getPendingDocuments,
);

// Admin review online documents
router.patch(
  "/:id/documents/review",
  auth,
  roleMiddleware(["ADMIN", "STAFF", "OWNER"]),
  reviewDocuments,
);

export default router;
