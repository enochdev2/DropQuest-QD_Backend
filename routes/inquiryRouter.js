import express from "express";
import {
  createInquiry,
  addInquiryComment,
  getAllActiveInquiries,
  getInquiryById,
  getPendingInquiries,
  getInProgressInquiries,
  getUserInquiries,
  updateInquiryStatusAndComment,
} from "../controllers/inquiryController.js";
import { authenticate, authorizeAdmin } from "../middleware/autheticate.js";

const router = express.Router();

// Public routes for authenticated users
router.post("/", authenticate, createInquiry); // User creates inquiry
router.get("/user", authenticate, getUserInquiries); // Get inquiries of authenticated user
router.get("/:inquiryId", authenticate, getInquiryById); // Get particular inquiry by ID

// Routes for admin only
router.use(authenticate, authorizeAdmin);
router.post("/:inquiryId/comment", addInquiryComment); // Admin adds comment only
router.put("/:inquiryId/status", updateInquiryStatusAndComment); // Admin updates comment & status

router.get("/all/active", getAllActiveInquiries); // Get all inquiries except Closed
router.get("/all/pending", getPendingInquiries); // Get all inquiries with status Pending
router.get("/all/inprogress", getInProgressInquiries); // Get all inquiries with status In Progress

export default router;
