import express from 'express';

// import asyncHandler from '../utils/asyncHandler';
import { createUserProfile, deleteUserProfile, getAllUsers, getUserProfile, loginUser, logoutUser, updateUserProfile } from "../controllers/userController.js";
import { authenticate } from '../middleware/autheticate.js';
import { approveSellOrder, createSellOrder, getPendingSellOrders, rejectSellOrder } from '../controllers/sellOrderController.js';
const router = express.Router();





router.post("/", createSellOrder); // Register new user
router.get("/admin/sell-orders/pending", getPendingSellOrders); // Get all users
router.get("/", getAllUsers); // Get all users
router.post("/admin/sell-orders/:orderId/approve", approveSellOrder); // Get user by nickname
router.post("/admin/sell-orders/:orderId/reject", rejectSellOrder); // Update user profile
router.get("/sell-orders",authenticate, updateUserProfile); // /api/sell-orders?status=On Sale


router.delete("/users/:nickname", authenticate, deleteUserProfile); // Delete user profile
router.post("/login", loginUser); // Login user
router.post("/logout", logoutUser); // Logout user



export default router;