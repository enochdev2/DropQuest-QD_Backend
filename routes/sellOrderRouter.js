import express from 'express';

// import asyncHandler from '../utils/asyncHandler';
import { approveSellOrder, createSellOrder, getAdminDashboardStats, getAllCompletedMatchedOrders, getAllCompletedOrders, getAllOnSaleOrders, getAllPendingApprovalOrders, getPendingSellOrders, getSummaryStats, getUserSellOrders, matchOrders, rejectSellOrder } from '../controllers/sellOrderController.js';
import { authenticate } from '../middleware/autheticate.js';
const router = express.Router();





router.post("/", authenticate, createSellOrder); // Register new user
router.get("/admin/sell-orders/pending", getPendingSellOrders); // Get all users
// router.get("/", getAllUsers); // Get all users
router.post("/admin/sell-orders/:orderId/approve", approveSellOrder); // Get user by nickname
router.post("/admin/sell-orders/:orderId/reject", rejectSellOrder); // Update user profile
router.get("/sell-orders",authenticate, getUserSellOrders); // /api/sell-orders?status=On Sale
router.get("/all-orders", getAllCompletedOrders); // /api/sell-orders?status=On Sale
router.get("/allmatched-orders", getAllCompletedMatchedOrders); 
router.get("/admin/all/onsale-orders", getAllOnSaleOrders); 
router.get("/admin/all/pending-orders", getAllPendingApprovalOrders); 
router.get("/admin/get-stats", getSummaryStats); 
router.get("/admin/getallstats", getAdminDashboardStats); 
router.post("/admin/match-orders", matchOrders); 




export default router;