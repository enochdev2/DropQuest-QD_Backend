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
  fetchUnreadUserProfileNotifications,
  fetchUnreadUserInquiryNotifications,
} from '../controllers/notificationController.js';
import { authenticate, authorizeAdmin } from '../middleware/autheticate.js';

const router = express.Router();

// Route to fetch unread notifications
router.get('/notifications/unread', fetchUnreadNotifications);

// Route to fetch all notifications (admin use case)
router.get('/notifications', authenticate, authorizeAdmin,  fetchAllNotifications);

// Route to mark a notification as read
router.put('/mark-read/:id', authenticate, markNotificationAsRead);
router.get("/unread/sellOrders", authenticate, authorizeAdmin, fetchUnreadSellOrderNotifications);
router.get("/unread/buyOrders",authenticate, authorizeAdmin, fetchUnreadBuyOrderNotifications);
router.get("/unread/chatSession", fetchUnreadChatSessionNotifications);
router.get("/unread/user/registration", authenticate, fetchUnreadUserProfileNotifications);
router.get("/unread/user/inquiry", authenticate, fetchUnreadUserInquiryNotifications);
router.get("/unread/user/buyOrders", authenticate, fetchUnreadUserBuyOrderNotifications);
router.get("/unread/user/sellOrders", authenticate, fetchUnreadUserSellOrderNotifications);


export default router;
 