import express from "express";
import {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  deleteAnnouncement,
} from "../controllers/annoucementController.js";
import { authenticate, authorizeAdmin } from "../middleware/autheticate.js";

const router = express.Router();

// Route to create a new announcement
router.post("/announcements", authenticate, authorizeAdmin, createAnnouncement);

// Route to get all announcements
router.get("/announcements", getAllAnnouncements);

router.get("/:announcementId", getAnnouncementById);

// Route to delete an announcement
router.delete("/announcements/:announcementId", deleteAnnouncement);

export default router;
