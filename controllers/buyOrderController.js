import mongoose from "mongoose";
import { BuyOrder } from "../models/buyOrder.js";
import {
  createNewAdminNotification,
  createNewUserNotification,
} from "./notificationController.js";
import { userModel } from "../models/userModel.js";

// Create new Buy Order
export const createBuyOrder = async (req, res) => {
  try {
    const userId = req.user.id; //
    // const nickname = req.user.nickname; //
    const { amount, krwAmount, price } = req.body;

    const user = await userModel
      .findById(userId)
      .select("nickname username phone status")
      .lean();

    if (user.status === "inactive")
      return res
        .status(404)
        .json({ error: "User Must be verified before placing an  Order" });

    const newBuyOrder = new BuyOrder({
      userId,
      buyerNickname: user.nickname,
      buyerPhone: user.phone,
      amount,
      amountRemaining: amount,
      price,
      // krwAmount,
    });
    await newBuyOrder.save();

    const message = `New buy order created by ${
      user.nickname || "a user"
    }: ${amount} units.`;
    await createNewAdminNotification(
      message,
      userId,
      "buyOrder",
      newBuyOrder._id
    );
    const messages = `you have successful placed a buy order of $ ${amount}.`;
    await createNewUserNotification(
      messages,
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

    order.status = "Waiting for Buy";
    order.amountRemaining = order.amount;
    await order.save();
    console.log("🚀 ~ approveBuyOrder ~ order:", order);

    await createNewUserNotification(
      `Your buy order #${orderId} has been approved.`,
      order.userId,
      "buyOrder",
      order._id
    );

    res.json(order);
  } catch (error) {
    console.log("🚀 ~ approveBuyOrder ~ error:", error);
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

export const getUserInProgressOrders = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated user's ID
    const inProgressStatus = "In Progress";

    // Find all sell orders by this user that are currently "In Progress"
    const inProgressOrders = await BuyOrder.find({
      userId,
      status: inProgressStatus,
    })
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      )
      .sort({ createdAt: -1 });

    res.json(inProgressOrders);
  } catch (error) {
    console.error("Error fetching user's in-progress orders:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllPendingBuyApprovalOrders = async (req, res) => {
  try {
    const onBuyStatus = "Pending Approval";

    const onBuyOrders = await BuyOrder.find({ status: onBuyStatus })
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      )
      .sort({ createdAt: -1 });

    const buyOrders = onBuyOrders;

    res.json(buyOrders);
  } catch (error) {
    console.error("Error fetching on-buy orders:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllInProgressApprovalOrders = async (req, res) => {
  try {
    const onBuyStatus = ["In Progress", "Partially Matched"];

    const onBuyOrders = await BuyOrder.find({ status: { $in: onBuyStatus } })
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      ) .populate({
        path: "matchedSellOrders.orderId", // << this populates BuyOrder via dynamic refPath
        model: "SellOrder",
        select: "sellerNickname", // pull nickname from BuyOrder
      })
      .sort({ createdAt: -1 });

    const buyOrders = onBuyOrders;

    res.json(buyOrders);
  } catch (error) {
    console.error("Error fetching on-sale sell orders:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllOnBuyOrders = async (req, res) => {
  try {
    const onBuyStatus = ["Waiting for Buy"]; // An array of statuses

    // Use the $in operator to check if the status is one of the desired statuses
    const onBuyOrders = await BuyOrder.find({
      status: { $in: onBuyStatus },
    }).populate(
      "userId",
      "username nickname fullName phone bankName bankAccount"
    );

    const buyOrders = onBuyOrders;

    res.json(buyOrders);
  } catch (error) {
    console.error("Error fetching on-buy orders:", error);
    res.status(500).json({ error: error.message });
  }
};
