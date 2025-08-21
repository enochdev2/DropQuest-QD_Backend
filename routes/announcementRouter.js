import express from "express";
import {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  deleteAnnouncement,
  EditAnnouncement,
} from "../controllers/annoucementController.js";
import { authenticate, authorizeAdmin } from "../middleware/autheticate.js";

const router = express.Router();

// Route to create a new announcement
router.post("/announcements", authenticate, authorizeAdmin, createAnnouncement);

// Route to get all announcements
router.get("/announcements", getAllAnnouncements);

router.get("/:announcementId", getAnnouncementById);

// Route to delete an announcement
router.put(
  "/announcements/:announcementId",
  authenticate,
  authorizeAdmin,
  EditAnnouncement
);

router.delete(
  "/announcements/:announcementId",
  authenticate,
  authorizeAdmin,
  deleteAnnouncement
);

export default router;
