import express from "express";

// import asyncHandler from '../utils/asyncHandler';
import {
  approveSellOrder,
  cancelTrade,
  completeOrders,
  createSellOrder,
  getAdminDashboardStats,
  getAllCompletedMatchedOrders,
  getAllCompletedOrders,
  getAllInProgressApprovalOrders,
  getAllOnSaleOrders,
  getAllPendingApprovalOrders,
  getPendingSellOrders,
  getSummaryStats,
  getUserInProgressOrders,
  getUserSellOrders,
  matchOrders,
  rejectSellOrder,
} from "../controllers/sellOrderController.js";
import { authenticate, authorizeAdmin } from "../middleware/autheticate.js";
const router = express.Router();

router.post("/", authenticate, createSellOrder);
router.get("/sell-orders", authenticate, getUserSellOrders); // /api/sell-orders?status=On Sale
router.get("/user/inProgress-orders", authenticate, getUserInProgressOrders);
router.get("/all-orders", getAllCompletedOrders);

//? ADMIN ROUTE
router.get(
  "/admin/sell-orders/pending",
  authenticate,
  authorizeAdmin,
  getPendingSellOrders
);
// router.get("/", getAllUsers); // Get all users
router.post(
  "/admin/sell-orders/:orderId/approve",
  authenticate,
  authorizeAdmin,
  approveSellOrder
); // Get user by nickname
router.post(
  "/admin/sell-orders/:orderId/reject",
  authenticate,
  authorizeAdmin,
  rejectSellOrder
);
router.get(
  "/allmatched-orders",
  authenticate,
  authorizeAdmin,
  getAllCompletedMatchedOrders
);
router.get(
  "/admin/all/onsale-orders",
  authenticate,
  authorizeAdmin,
  getAllOnSaleOrders
);
router.get(
  "/admin/all/pending-orders",
  authenticate,
  authorizeAdmin,
  getAllPendingApprovalOrders
);
router.get(
  "/admin/all/inProgress-orders",
  authenticate,
  authorizeAdmin,
  getAllInProgressApprovalOrders
);
router.get("/admin/get-stats", authenticate, authorizeAdmin, getSummaryStats);
router.get(
  "/admin/getallstats",
  authenticate,
  authorizeAdmin,
  getAdminDashboardStats
);
router.post("/admin/match-orders", authenticate, authorizeAdmin, matchOrders);
router.post(
  "/admin/complete-orders",
  authenticate,
  authorizeAdmin,
  completeOrders
);
router.post("/admin/cancel-orders", authenticate, authorizeAdmin, cancelTrade);

export default router;
