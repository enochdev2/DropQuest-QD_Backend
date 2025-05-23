import mongoose from "mongoose";
import { BuyOrder } from "../models/buyOrder.js";
import {
  createNewAdminNotification,
  createNewUserNotification,
} from "./notificationController.js";

// Create new Buy Order
export const createBuyOrder = async (req, res) => {
  try {

    const userId = req.user.id; // 
    console.log("🚀 ~ createBuyOrder ~ userId:", userId)
    const { amount, krwAmount, price } = req.body;
    // const userId = new mongoose.Types.ObjectId(nickname);

    const newBuyOrder = new BuyOrder({ userId, amount,krwAmount, price });
    await newBuyOrder.save();

    const message = `New buy order created by ${
      userId || "a user"
    }: ${amount} units.`;
    await createNewAdminNotification(
      message,
      userId,
      "buyOrder",
      newBuyOrder._id
    );

    res.status(201).json(newBuyOrder);
  } catch (error) {
    console.error("Error creating buy order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all buy orders with status "Waiting for Buy" (for Admin)
export const getPendingBuyOrders = async (req, res) => {
  try {
    const pendingOrders = await BuyOrder.find({ status: "Waiting for Buy" })
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      )
      .sort({ createdAt: -1 });

    res.json(pendingOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve Buy Order (Admin)
export const approveBuyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await BuyOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: "Buy order not found" });

    order.status = "Buy Completed";
    await order.save();

    await createNewUserNotification(
      `Your buy order #${orderId} has been approved and marked as Buy Completed.`,
      order.userId,
      "buyOrder",
      order._id
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject Buy Order (Admin)
export const rejectBuyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await BuyOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: "Buy order not found" });

    await order.deleteOne();

    await createNewUserNotification(
      `Your buy order #${orderId} has been rejected.`,
      order.userId,
      "buyOrder",
      order._id
    );

    res.json({ message: "Buy order rejected and removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's buy orders (with optional status filter and custom sort)
export const getUserBuyOrders = async (req, res) => {
  try {
    const userId = req.user.id; // authenticated user ID
    console.log("🚀 ~ getUserBuyOrders ~ userId:", userId);
    const statusFilter = req.query.status;

    let filter = { userId };

    if (statusFilter) {
      filter.status = statusFilter;
    }

    let orders;
    orders = await BuyOrder.find(filter)
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      )
      .sort({ createdAt: -1 });

    // if (!statusFilter) {
    //   orders = await BuyOrder.aggregate([
    //     { $match: { userId } },
    //     {
    //       $addFields: {
    //         statusOrder: {
    //           $switch: {
    //             branches: [
    //               { case: { $eq: ["$status", "Waiting for Buy"] }, then: 1 },
    //               { case: { $eq: ["$status", "Buy Completed"] }, then: 2 },
    //             ],
    //             default: 3,
    //           },
    //         },
    //       },
    //     },
    //     { $sort: { statusOrder: 1, createdAt: -1 } },
    //   ]);
    // } else {
    //   orders = await BuyOrder.find(filter).sort({ createdAt: -1 });
    // }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
