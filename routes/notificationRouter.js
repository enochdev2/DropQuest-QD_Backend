import express from 'express';
import {
  fetchUnreadNotifications,
  fetchAllNotifications,
  markNotificationAsRead,
  fetchUnreadSellOrderNotifications,
  fetchUnreadBuyOrderNotifications,
  fetchUnreadUserBuyOrderNotifications,
  fetchUnreadUserSellOrderNotifications,
  fetchUnreadChatSessionNotifications,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/autheticate.js';

const router = express.Router();

// Route to fetch unread notifications
router.get('/notifications/unread', fetchUnreadNotifications);

// Route to fetch all notifications (admin use case)
router.get('/notifications', fetchAllNotifications);

// Route to mark a notification as read
router.put('/mark-read/:id', markNotificationAsRead);
// router.patch("/notifications/mark-read/:id", markNotificationAsRead);
router.get("/unread/sellOrders", fetchUnreadSellOrderNotifications);
router.get("/unread/buyOrders", fetchUnreadBuyOrderNotifications);
router.get("/unread/chatSession", fetchUnreadChatSessionNotifications);
router.get("/unread/user/buyOrders", authenticate, fetchUnreadUserBuyOrderNotifications);
router.get("/unread/user/sellOrder", authenticate, fetchUnreadUserSellOrderNotifications);


export default router;
 