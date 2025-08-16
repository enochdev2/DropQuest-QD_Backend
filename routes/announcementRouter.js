import express from "express";
import {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  deleteAnnouncement,
} from "../controllers/annoucementController.js";

const router = express.Router();

// Route to create a new announcement
router.post("/announcements", createAnnouncement);

// Route to get all announcements
router.get("/announcements", getAllAnnouncements);

router.get("/:announcementId", getAnnouncementById);

// Route to delete an announcement
router.delete("/announcements/:announcementId", deleteAnnouncement);

export default router;
