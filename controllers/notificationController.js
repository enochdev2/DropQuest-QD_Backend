import {
  getUnreadNotifications,
  getNotifications,
  markAsRead,
  createUserNotification,
  createAdminNotification,
  Notification,
} from "../models/notification.js";

// Create a notification when a new user registers
export const createNewUserNotification = async (
  message,
  userId,
  type,
  referenceId
) => {
  try {
    const notification = await createUserNotification(
      message,
      userId,
      type,
      referenceId
    );
    return notification;
  } catch (err) {
    console.error("Error inside createNewUserNotification:", err);
    throw new Error("Error creating notification: " + err.message);
  }
};

export const createNewAdminNotification = async (
  message,
  userId,
  type,
  referenceId
) => {
  try {
    const notification = await createAdminNotification(
      message,
      userId,
      type,
      referenceId
    );
    return notification;
  } catch (err) {
    console.error("Error inside createNewAdminNotification:", err);
    throw new Error("Error creating notification: " + err.message);
  }
};

// Get unread notifications for the admin
export const fetchUnreadNotifications = async (req, res) => {
  try {
    const notifications = await getUnreadNotifications();
    return res.status(200).json(notifications);
  } catch (err) {
    return res.status(500).json({ error: "Error fetching notifications." });
  }
};

// Get all notifications (can be used for both admin dashboard or internal purposes)
export const fetchAllNotifications = async (req, res) => {
  try {
    const notifications = await getNotifications();
    return res.status(200).json(notifications);
  } catch (err) {
    return res.status(500).json({ error: "Error fetching all notifications." });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    console.log(
      "🚀 ~ markNotificationAsRead ~ notificationId:",
      notificationId
    );
    const updatedNotification = await markAsRead(notificationId);

    if (!updatedNotification) {
      return res.status(404).json({ error: "Notification not found." });
    }

    return res.status(200).json(updatedNotification);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Error updating notification status." });
  }
};

export const fetchUnreadSellOrderNotifications = async (req, res) => {
  try {
    // If you want to filter by userId (optional, e.g. from req.user.id)
    // const userId = req.user.id;

    // If userId is required:
    // const notifications = await Notification.find({
    //   userId,
    //   isForAdmin: false,
    //   isRead: false,
    //   type: "sellOrder"
    // }).sort({ createdAt: -1 });

    // If admin wants all unread sellOrder notifications (no user filter):
    const notifications = await Notification.find({
      isForAdmin: true,
      isRead: false,
      type: "sellOrder",
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username nickname");
    console.log(
      "🚀 ~ fetchUnreadSellOrderNotifications ~ notifications:",
      notifications
    );

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching unread sellOrder notifications:", error);
    return res.status(500).json({ error: "Error fetching notifications." });
  }
};

export const fetchUnreadBuyOrderNotifications = async (req, res) => {
  try {
    // If you want to filter by userId (optional, e.g. from req.user.id)
    // const userId = req.user.id;

    // If userId is required:
    // const notifications = await Notification.find({
    //   userId,
    //   isForAdmin: false,
    //   isRead: false,
    //   type: "sellOrder"
    // }).sort({ createdAt: -1 });

    // If admin wants all unread sellOrder notifications (no user filter):
    const notifications = await Notification.find({
      isForAdmin: true,
      isRead: false,
      type: "buyOrder",
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username nickname");
    console.log(
      "🚀 ~ fetchUnreadSellOrderNotifications ~ notifications:",
      notifications
    );

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching unread sellOrder notifications:", error);
    return res.status(500).json({ error: "Error fetching notifications." });
  }
};
export const fetchUnreadChatSessionNotifications = async (req, res) => {
  try {
    // If you want to filter by userId (optional, e.g. from req.user.id)
    // const userId = req.user.id;

    // If userId is required:
    // const notifications = await Notification.find({
    //   userId,
    //   isForAdmin: false,
    //   isRead: false,
    //   type: "sellOrder"
    // }).sort({ createdAt: -1 });

    // If admin wants all unread sellOrder notifications (no user filter):
    const notifications = await Notification.find({
      isForAdmin: true,
      isRead: false,
      type: "chat",
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username nickname");
    console.log(
      "🚀 ~ fetchUnreadSellOrderNotifications ~ notifications:",
      notifications
    );

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching unread sellOrder notifications:", error);
    return res.status(500).json({ error: "Error fetching notifications." });
  }
};

export const fetchUnreadUserProfileNotifications = async (req, res) => {
  try {
    // If you want to filter by userId (optional, e.g. from req.user.id)
    const userId = req.user.id;

    // If userId is required:
    const notifications = await Notification.find({
      userId,
      isForAdmin: false,
      isRead: false,
      type: "registration",
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username nickname");

    // If admin wants all unread sellOrder notifications (no user filter):
    // const notifications = await Notification.find({
    //   isForAdmin: true,
    //   isRead: false,
    //   type: "buyOrder",
    // })
    //   .sort({ createdAt: -1 })
    // .populate("userId", "username nickname");
    // console.log(
    //   "🚀 ~ fetchUnreadSellOrderNotifications ~ notifications:",
    //   notifications
    // );

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching unread sellOrder notifications:", error);
    return res.status(500).json({ error: "Error fetching notifications." });
  }
};

export const fetchUnreadUserInquiryNotifications = async (req, res) => {
  try {
    // If you want to filter by userId (optional, e.g. from req.user.id)
    const userId = req.user.id;

    // If userId is required:
    const notifications = await Notification.find({
      userId,
      isForAdmin: false,
      isRead: false,
      type: "inquiry",
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username nickname");

    // If admin wants all unread sellOrder notifications (no user filter):
    // const notifications = await Notification.find({
    //   isForAdmin: true,
    //   isRead: false,
    //   type: "buyOrder",
    // })
    //   .sort({ createdAt: -1 })
    // .populate("userId", "username nickname");
    // console.log(
    //   "🚀 ~ fetchUnreadSellOrderNotifications ~ notifications:",
    //   notifications
    // );

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching unread sellOrder notifications:", error);
    return res.status(500).json({ error: "Error fetching notifications." });
  }
};

export const fetchUnreadAdminInquiryNotifications = async (req, res) => {
  try {
    // If admin wants all unread sellOrder notifications (no user filter):
    const notifications = await Notification.find({
      isForAdmin: true,
      isRead: false,
      type: "inquiry",
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username nickname");

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching unread sellOrder notifications:", error);
    return res.status(500).json({ error: "Error fetching notifications." });
  }
};

export const fetchUnreadUserBuyOrderNotifications = async (req, res) => {
  try {
    // If you want to filter by userId (optional, e.g. from req.user.id)
    const userId = req.user.id;

    // If userId is required:
    const notifications = await Notification.find({
      userId,
      isForAdmin: false,
      isRead: false,
      type: "buyOrder",
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username nickname");

    // If admin wants all unread sellOrder notifications (no user filter):
    // const notifications = await Notification.find({
    //   isForAdmin: true,
    //   isRead: false,
    //   type: "buyOrder",
    // })
    //   .sort({ createdAt: -1 })
    // .populate("userId", "username nickname");
    // console.log(
    //   "🚀 ~ fetchUnreadSellOrderNotifications ~ notifications:",
    //   notifications
    // );

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching unread sellOrder notifications:", error);
    return res.status(500).json({ error: "Error fetching notifications." });
  }
};

export const fetchUnreadUserSellOrderNotifications = async (req, res) => {
  try {
    // If you want to filter by userId (optional, e.g. from req.user.id)
    const userId = req.user.id;

    // If userId is required:
    const notifications = await Notification.find({
      userId,
      isForAdmin: false,
      isRead: false,
      type: "sellOrder",
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username nickname");

    // If admin wants all unread sellOrder notifications (no user filter):
    // const notifications = await Notification.find({
    //   isForAdmin: true,
    //   isRead: false,
    //   type: "buyOrder",
    // })
    //   .sort({ createdAt: -1 })
    // .populate("userId", "username nickname");
    // console.log(
    //   "🚀 ~ fetchUnreadSellOrderNotifications ~ notifications:",
    //   notifications
    // );

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching unread sellOrder notifications:", error);
    return res.status(500).json({ error: "Error fetching notifications." });
  }
};
