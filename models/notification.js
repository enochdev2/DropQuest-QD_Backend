import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Notification schema definition
const notificationsSchema = new Schema(
  {
    message: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // user who triggered event
    type: {
      type: String,
      enum: ["registration", "sellOrder", "buyOrder", "inquiry", "general"],
      default: "general",
    },
    isForAdmin: { type: Boolean, default: false }, // visible in admin dashboard if true
    referenceId: { type: Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
); 

// Model export
export const Notification = mongoose.model("Notification", notificationsSchema);

export const createAdminNotification = async (
  message,
  userId,
  type,
  referenceId = null
) => {
  const notification = new Notification({
    message,
    userId,
    type,
    isForAdmin: true,
    referenceId,
  });
  await notification.save();
  return notification.toObject();
};

export const createUserNotification = async (
  message,
  userId,
  type,
  referenceId = null
) => {
  console.log("🚀 ~ message",message, userId, type, referenceId)

  const notification = new Notification({
    message,
    userId,
    type,
    isForAdmin: false,
    referenceId,
  });
  await notification.save();
  return notification.toObject();
};

export const getUnreadNotifications = (userId = null) => {
  if (userId) {
    // User notifications (not for admin)
    return Notification.find({ userId, isForAdmin: false, isRead: false });
  } else {
    // Admin dashboard notifications (not user-specific)
    return Notification.find({ isForAdmin: true, isRead: false });
  }
};

export const getNotifications = (userId = null) => {
  if (userId) {
    return Notification.find({ userId, isForAdmin: false });
  } else {
    return Notification.find({ isForAdmin: true });
  }
};

export const markAsRead = (notificationId) =>
  Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );
