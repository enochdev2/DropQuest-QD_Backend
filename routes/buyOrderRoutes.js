import express from "express";
import {
  createBuyOrder,
  getPendingBuyOrders,
  approveBuyOrder,
  rejectBuyOrder,
  getUserBuyOrders,
  getAllOnBuyOrders,
} from "../controllers/buyOrderController.js";

import { authenticate } from '../middleware/autheticate.js';
import { getAllPendingApprovalOrders } from "../controllers/sellOrderController.js";

const router = express.Router();

router.post("/", authenticate, createBuyOrder); // Create new buy order (user)
router.get("/admin/buy-orders/pending", getPendingBuyOrders); // Admin view pending
router.post("/admin/buy-orders/:orderId/approve", approveBuyOrder); // Admin approve
router.post("/admin/buy-orders/:orderId/reject", rejectBuyOrder); // Admin reject
router.get("/buy-orders", authenticate, getUserBuyOrders); // Get user buy orders with optional status filter
router.get("/admin/all/onbuy-orders", getAllOnBuyOrders);
router.get("/admin/all/pending-orders", getAllPendingApprovalOrders);

export default router;
 