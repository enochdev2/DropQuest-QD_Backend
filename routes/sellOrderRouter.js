import express from 'express';

// import asyncHandler from '../utils/asyncHandler';
import { createUserProfile, deleteUserProfile, getAllUsers, getUserProfile, loginUser, logoutUser, updateUserProfile } from "../controllers/userController.js";
import { authenticate } from '../middleware/autheticate.js';
import { approveSellOrder, rejectSellOrder } from '../controllers/sellOrderController.js';
const router = express.Router();




router.post("/", createUserProfile); // Register new user
router.get("/admin/sell-orders/pending", getAllUsers); // Get all users
router.post("/admin/sell-orders/:orderId/approve", approveSellOrder); // Get user by nickname
router.post("/admin/sell-orders/:orderId/reject",authenticate, rejectSellOrder); // Update user profile
router.get("/sell-orders",authenticate, updateUserProfile); // /api/sell-orders?status=On Sale


router.delete("/users/:nickname", authenticate, deleteUserProfile); // Delete user profile
router.post("/login", loginUser); // Login user
router.post("/logout", logoutUser); // Logout user



export default router;