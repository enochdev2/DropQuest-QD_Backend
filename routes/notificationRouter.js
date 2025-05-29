import express from 'express';
import {
  fetchUnreadNotifications,
  fetchAllNotifications,
  markNotificationAsRead,
  fetchUnreadSellOrderNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

// Route to fetch unread notifications
router.get('/notifications/unread', fetchUnreadNotifications);

// Route to fetch all notifications (admin use case)
router.get('/notifications', fetchAllNotifications);

// Route to mark a notification as read
router.put('/mark-read/:id', markNotificationAsRead);
// router.patch("/notifications/mark-read/:id", markNotificationAsRead);
router.get("/unread/sellOrders", fetchUnreadSellOrderNotifications);


export default router;
 