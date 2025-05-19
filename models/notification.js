import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Notification schema definition
const notificationSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',  // Reference to the User model
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,  // Notification is unread by default
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Model export
export const Notification = mongoose.model("Notification", notificationSchema);

// Utility functions for notifications
export const createNotification = async (message, userId) => {
  const notification = new Notification({
    message,
    userId,
  });
  await notification.save();
  return notification.toObject();
};

export const getUnreadNotifications = () => Notification.find({ isRead: false });

export const getNotifications = () => Notification.find();
export const markAsRead = (notificationId) => Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
