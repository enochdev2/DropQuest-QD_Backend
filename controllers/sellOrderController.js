import { BuyOrder } from "../models/buyOrder.js";
import { SellOrder } from "../models/sellOrder.js";
import { userModel } from "../models/userModel.js";
import { TransactionFee } from "../models/feeModel.js";

import {
  createNewAdminNotification,
  createNewUserNotification,
} from "./notificationController.js";

export const createSellOrder = async (req, res) => {
  try {
    const userId = req.user.id; // assume authenticated user middleware
    const { amount, price, krwAmount } = req.body;

    const user = await userModel
      .findById(userId)
      .select("nickname username")
      .lean();

    const userName = user?.nickname || user?.username || "a user";

    const newOrder = new SellOrder({ userId, amount, price, krwAmount });
    await newOrder.save();

    const message = `New sell order created by ${userName}: ${amount} USDT at price ${price} KRW (Total: ${krwAmount} KRW).`;
    const type = "sellOrder";
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
    console.log("🚀 ~ approveSellOrder ~ order:", order);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = "On Sale";
    order.amountRemaining = order.amount;
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
    console.log("🚀 ~ approveSellOrder ~ error:", error);
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
    const userId = req.user.id; // authenticated user ID
    console.log("🚀 ~ getUserSellOrders ~ userId:", userId);
    const statusFilter = req.query.status; // optional status filter

    // Base filter: only this user's sell orders
    let filter = { userId };

    if (statusFilter) {
      // If specific status is requested, filter by that status only
      filter.status = statusFilter;
    }

    let orders;

    orders = await SellOrder.find(filter)
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      )
      .sort({ createdAt: -1 });

    // if (!statusFilter) {
    //   orders = await SellOrder.aggregate([
    //     { $match: { userId } },
    //     {
    //       $addFields: {
    //         statusOrder: {
    //           $switch: {
    //             branches: [
    //               { case: { $eq: ["$status", "On Sale"] }, then: 1 },
    //               { case: { $eq: ["$status", "Pending Approval"] }, then: 2 },
    //               { case: { $eq: ["$status", "Sale Completed"] }, then: 3 },
    //             ],
    //             default: 4,
    //           },
    //         },
    //       },
    //     },
    //     { $sort: { statusOrder: 1, createdAt: -1 } }, // sort by custom order, then newest first
    //   ]);
    // } else {
    //   // If filtered by status, simple find + sort by createdAt descending
    //   orders = await SellOrder.find(filter).sort({ createdAt: -1 });
    // }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllPendingApprovalOrders = async (req, res) => {
  try {
    const onSaleStatus = "Pending Approval";

    const onSaleSellOrders = await SellOrder.find({ status: onSaleStatus })
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      )
      .sort({ createdAt: -1 });

    const sellOrders = onSaleSellOrders;

    res.json(sellOrders);
  } catch (error) {
    console.error("Error fetching on-sale sell orders:", error);
    res.status(500).json({ error: error.message });
  }
};
export const getAllOnSaleOrders = async (req, res) => {
  try {
    const onSaleStatus = "On Sale";

    const onSaleSellOrders = await SellOrder.find({ status: onSaleStatus })
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      )
      .sort({ createdAt: 1 });
    console.log(
      "🚀 ~ getAllOnSaleOrders ~ onSaleSellOrders:",
      onSaleSellOrders
    );

    const sellOrders = onSaleSellOrders;

    res.json(sellOrders);
  } catch (error) {
    console.error("Error fetching on-sale sell orders:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllCompletedOrders = async (req, res) => {
  try {
    // Define completed statuses for sell and buy
    const completedSellStatus = "Sale Completed";
    const completedBuyStatus = "Buy Completed";

    // Fetch completed sell orders with user info populated
    const completedSellOrders = await SellOrder.find({
      status: completedSellStatus,
    })
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      )
      .sort({ createdAt: -1 });

    // Fetch completed buy orders with user info populated
    const completedBuyOrders = await BuyOrder.find({
      status: completedBuyStatus,
    })
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      )
      .sort({ createdAt: -1 });

    // Optionally, you can merge and sort both lists by createdAt descending
    // If you want a single combined list sorted by date:
    const combinedOrders = [...completedSellOrders, ...completedBuyOrders].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    res.json({
      sellOrders: completedSellOrders,
      buyOrders: completedBuyOrders,
      combinedOrders, // optional
    });
  } catch (error) {
    console.error("Error fetching completed orders:", error);
    res.status(500).json({ error: error.message });
  }
};

export const matchOrders = async (req, res) => {
  try {
    const { sellOrderId, buyOrderMatches } = req.body;

    // 1. Fetch sell order
    const sellOrder = await SellOrder.findById(sellOrderId);
    if (!sellOrder)
      return res.status(404).json({ error: "Sell order not found" });

    if (!["On Sale", "Partially Matched"].includes(sellOrder.status)) {
      return res
        .status(400)
        .json({ error: "Sell order not available for matching" });
    }

    // Calculate total match amount requested
    const totalMatchAmount = buyOrderMatches.reduce(
      (sum, m) => sum + m.matchAmount,
      0
    );
    if (totalMatchAmount > sellOrder.amountRemaining) {
      return res
        .status(400)
        .json({ error: "Match amount exceeds sell order remaining amount" });
    }

    // 2. Process each buy order match
    for (const match of buyOrderMatches) {
      const buyOrder = await BuyOrder.findById(match.buyOrderId);
      if (!buyOrder)
        return res
          .status(404)
          .json({ error: `Buy order ${match.buyOrderId} not found` });

      if (
        !["Pending", "Waiting for Fill", "Partially Matched"].includes(
          buyOrder.status
        )
      ) {
        return res.status(400).json({
          error: `Buy order ${match.buyOrderId} not available for matching`,
        });
      }

      if (match.matchAmount > buyOrder.amountRemaining) {
        return res.status(400).json({
          error: `Match amount exceeds buy order remaining amount for ${match.buyOrderId}`,
        });
      }

      // Update buy order
      buyOrder.amountRemaining -= match.matchAmount;
      buyOrder.matchedSellOrders.push({
        orderId: sellOrder._id,
        matchModel: "SellOrder",
        amount: match.matchAmount,
      });

      buyOrder.status =
        buyOrder.amountRemaining === 0 ? "Buy Completed" : "Partially Matched";
      await buyOrder.save();

      // Update sell order matchedBuyOrders inside loop to keep partial matches
      sellOrder.matchedBuyOrders.push({
        orderId: buyOrder._id,
        matchModel: "BuyOrder",
        amount: match.matchAmount,
      });
    }

    // 3. Update sell order after all matches
    sellOrder.amountRemaining -= totalMatchAmount;
    sellOrder.status =
      sellOrder.amountRemaining === 0 ? "Sale Completed" : "Partially Matched";
    await sellOrder.save();

    // 4. Notify users or handle other business logic here

    res.json({ message: "Orders matched successfully", sellOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getSummaryStats = async (req, res) => {
  try {
    // Total users
    const totalUsersPromise = userModel.countDocuments();

    // Total sales (sum of krwAmount on completed SellOrders)
    const totalSalesPromise = SellOrder.aggregate([
      { $match: { status: "Sale Completed" } },
      { $group: { _id: null, totalKrwAmount: { $sum: "$krwAmount" } } },
    ]);

    // Total buys (sum of buy orders' cash amounts)
    // assuming BuyOrder.price * amount if price exists, else amount only
    const totalBuysPromise = BuyOrder.aggregate([
      {
        $project: {
          cashAmount: {
            $cond: [
              { $ifNull: ["$price", false] },
              { $multiply: ["$price", "$amount"] },
              "$amount",
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCashAmount: { $sum: "$cashAmount" },
        },
      },
    ]);

    // Total fees (sum of fees from TransactionFee)
    // We'll sum fixedFee + (feePercentage * some base amount) —
    // but since we only have feePercentage and fixedFee and no base amount here,
    // You might want to sum fixedFee only or sum fees from BuyOrders' fee fields if available.

    // For simplicity, let's sum fixedFee from TransactionFee collection.
    const totalFeesPromise = TransactionFee.aggregate([
      {
        $group: {
          _id: null,
          totalFixedFees: { $sum: "$fixedFee" },
          totalFeePercentages: { $sum: "$feePercentage" },
        },
      },
    ]);

    // Run all concurrently
    const [totalUsers, totalSales, totalBuys, totalFees] = await Promise.all([
      totalUsersPromise,
      totalSalesPromise,
      totalBuysPromise,
      totalFeesPromise,
    ]);

    res.json({
      totalUsers,
      totalSales: totalSales.length ? totalSales[0].totalKrwAmount : 0,
      totalBuys: totalBuys.length ? totalBuys[0].totalCashAmount : 0,
      totalFees: totalFees.length ? totalFees[0].totalFixedFees : 0,
      // You can adjust fees calculation here as needed
    });
  } catch (error) {
    console.error("Error fetching summary stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
