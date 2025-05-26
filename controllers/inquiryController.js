import { Inquiry } from "../models/inquiry.js";
import {
  createNewAdminNotification,
  createNewUserNotification,
} from "./notificationController.js";

// Create new inquiry - notify admin
export const createInquiry = async (req, res) => {
  try {
    const userId = req.user.id; // authenticated user
    const { title, description } = req.body;
    console.log("🚀 ~ createInquiry ~ title:", title)

    const newInquiry = new Inquiry({
      userId,
      title,
      description,
    });

    await newInquiry.save();

    // Notify admin about new inquiry
    await createNewAdminNotification(
      `New inquiry titled "${title}" from user ${userId}`,
      userId,
      "inquiry",
      newInquiry._id
    );

    res.status(201).json(newInquiry);
  } catch (error) {
    console.error("Error creating inquiry:", error);
    res.status(500).json({ error: error.message });
  }
};

// Admin adds comment - notify user
export const addInquiryComment = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { comment } = req.body;

    // Only admin can call this - make sure your middleware validates this
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });

    inquiry.comment = comment;
    await inquiry.save();

    // Notify user about comment
    await createNewUserNotification(
      `Admin commented on your inquiry "${inquiry.title}": ${comment}`,
      inquiry.userId,
      "inquiry",
      inquiry._id
    );

    res.json(inquiry);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: error.message });
  }
};



// Get all inquiries except "Closed"
export const getAllActiveInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ status: { $ne: "Closed" } })
      .populate("userId", "username") // optional, to include username
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    console.error("Error fetching active inquiries:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get particular inquiry by ID
export const getInquiryById = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const inquiry = await Inquiry.findById(inquiryId).populate("userId", "username");
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });

    res.json(inquiry);
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all inquiries with status "Pending"
export const getPendingInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ status: "Pending" })
      .populate("userId", "username")
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    console.error("Error fetching pending inquiries:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all inquiries with status "In Progress"
export const getInProgressInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ status: "In Progress" })
      .populate("userId", "username")
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    console.error("Error fetching in-progress inquiries:", error);
    res.status(500).json({ error: error.message });
  }
};


// Get all inquiries for a specific user
export const getUserInquiries = async (req, res) => {
  try {
    const userId = req.user.id; // assuming authenticated user

    const inquiries = await Inquiry.find({ userId })
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    console.error("Error fetching user inquiries:", error);
    res.status(500).json({ error: error.message });
  }
};


// Admin updates comment and status - notify user
export const updateInquiryStatusAndComment = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { comment, status } = req.body;

    // Validate status if provided
    const validStatuses = ["Pending", "In Progress", "Resolved", "Closed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Only admin can call this - ensure your middleware enforces this
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });

    if (comment !== undefined) {
      inquiry.comment = comment;
    }
    if (status !== undefined) {
      inquiry.status = status;
    }

    await inquiry.save();

    // Notify user about the update
    let notificationMessage = `Your inquiry "${inquiry.title}" has been updated.`;
    if (comment) notificationMessage += ` Admin comment: ${comment}`;
    if (status) notificationMessage += ` Status: ${status}.`;

    await createUserNotification(
      notificationMessage,
      inquiry.userId,
      "inquiry",
      inquiry._id
    );

    res.json(inquiry);
  } catch (error) {
    console.error("Error updating inquiry:", error);
    res.status(500).json({ error: error.message });
  }
};
