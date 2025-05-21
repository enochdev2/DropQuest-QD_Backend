import mongoose from "mongoose";
import { SellOrder } from "../models/sellOrder.js";
import {
  createNewAdminNotification,
  createNewUserNotification,
} from "./notificationController.js";

export const createSellOrder = async (req, res) => {
  try {
    // const userId = req.user._id; // assume authenticated user middleware
    const { amount, price, krwAmount, nickname } = req.body;
    const userId = new mongoose.Types.ObjectId(nickname); // assume authenticated user middleware
    console.log("🚀 ~ createSellOrder ~ userId:", userId)

    const newOrder = new SellOrder({ userId, amount, price, krwAmount });
    await newOrder.save();

    const message = `New sell order created by ${nickname || 'a user'}: ${amount} USDT at price ${price} KRW (Total: ${krwAmount} KRW).`;
    const type = 'sellOrder';  // example type for notification categorization
    const referenceId = newOrder._id;

    await createNewUserNotification(message, userId, type, referenceId);
 
    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating sell order or notification:", error);
    res.status(500).json({ error: error.message });

  }
};

export const getPendingSellOrders = async (req, res) => {
  try {
    // Find all SellOrders with status "Pending Approval"
    // Populate user info for each order (e.g. username, nickname)
    const pendingOrders = await SellOrder.find({ status: "Pending Approval" })
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      ) // select fields you want
      .sort({ createdAt: -1 }); // latest first

    res.json(pendingOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveSellOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await SellOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = "On Sale";
    await order.save();
    // Notify user
    await createNewUserNotification(
      `Your sell order #${orderId} has been approved and is now On Sale.`,
      order.userId,
      "sellOrder",
      order._id
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectSellOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await SellOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // You might want to delete or mark rejected orders differently
    await order.deleteOne();

    // Notify user about rejection
     await createNewUserNotification(
      `Your sell order #${orderId}  has been rejected.`,
      order.userId, 
      "sellOrder",
      order._id
    );

    res.json({ message: "Order rejected and removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserSellOrders = async (req, res) => {
  try {
    const userId = req.user._id; // authenticated user ID
    const statusFilter = req.query.status; // optional status filter

    // Base filter: only this user's sell orders
    let filter = { userId };

    if (statusFilter) {
      // If specific status is requested, filter by that status only
      filter.status = statusFilter;
    }

    // If no specific status filter, get all statuses sorted in custom order
    // We use aggregation with $addFields and $sort to custom sort by status

    let orders;

    if (!statusFilter) {
      orders = await SellOrder.aggregate([
        { $match: { userId } },
        {
          $addFields: {
            statusOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ["$status", "On Sale"] }, then: 1 },
                  { case: { $eq: ["$status", "Pending Approval"] }, then: 2 },
                  { case: { $eq: ["$status", "Sale Completed"] }, then: 3 },
                ],
                default: 4,
              },
            },
          },
        },
        { $sort: { statusOrder: 1, createdAt: -1 } }, // sort by custom order, then newest first
      ]);
    } else {
      // If filtered by status, simple find + sort by createdAt descending
      orders = await SellOrder.find(filter).sort({ createdAt: -1 });
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
