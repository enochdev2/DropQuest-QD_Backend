import { announcementModel } from "../models/announcementModel.js";
import { userModel } from "../models/userModel.js"; // Assuming you have a user model

// Function to create a new announcement
export const createAnnouncement = async (req, res) => {
  const { title, content } = req.body;
  const createdBy = req.user._id; // Assuming the admin is logged in

  try {
    const newAnnouncement = new announcementModel({
      title,
      content,
      createdBy,
    });

    await newAnnouncement.save();
    res.status(201).json({
      message: "Announcement created successfully",
      announcement: newAnnouncement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ error: "Failed to create announcement" });
  }
};

// Function to get all announcements
export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await announcementModel.find({ isDeleted: false });
    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
};

// Function to get a single announcement by ID
export const getAnnouncementById = async (req, res) => {
  const { announcementId } = req.params;

  try {
    const announcement = await announcementModel
      .findOne({ _id: announcementId, isDeleted: false })
      .populate("createdBy", "name email"); // Populate creator details if needed

    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    res.status(200).json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    res.status(500).json({ error: "Failed to fetch announcement" });
  }
};

// Function to delete an announcement
export const deleteAnnouncement = async (req, res) => {
  const { announcementId } = req.params;

  try {
    const announcement = await announcementModel.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    announcement.isDeleted = true;
    await announcement.save();
    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
};
