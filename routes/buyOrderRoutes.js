import express from "express";
import {
  createBuyOrder,
  getPendingBuyOrders,
  approveBuyOrder,
  rejectBuyOrder,
  getUserBuyOrders,
  getAllOnBuyOrders,
  getAllPendingBuyApprovalOrders,
  getAllInProgressApprovalOrders,
  getUserInProgressOrders,
} from "../controllers/buyOrderController.js";

import { authenticate, authorizeAdmin } from '../middleware/autheticate.js';

const router = express.Router();
//? USER ROUTES
router.post("/", authenticate, createBuyOrder); // Create new buy order (user)
router.get("/buy-orders", authenticate, getUserBuyOrders); // Get user buy orders with optional status filter
router.get("/user/inProgress-orders", authenticate, getUserInProgressOrders); // Get user buy orders with optional status filter

//? USER ROUTES
router.get("/admin/buy-orders/pending",authenticate, authorizeAdmin, getPendingBuyOrders); // Admin view pending
router.post("/admin/buy-orders/:orderId/approve",authenticate, authorizeAdmin, approveBuyOrder); // Admin approve
router.post("/admin/buy-orders/:orderId/reject",authenticate, authorizeAdmin, rejectBuyOrder); // Admin reject
router.get("/admin/all/onbuy-orders",authenticate, authorizeAdmin, getAllOnBuyOrders);
router.get("/admin/all/pending-orders",authenticate, authorizeAdmin, getAllPendingBuyApprovalOrders);
router.get("/admin/all/inProgress-orders", authenticate, authorizeAdmin, getAllInProgressApprovalOrders);

export default router;
 