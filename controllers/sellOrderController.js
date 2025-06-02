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
      .select("nickname username phone")
      .lean();

    const userName = user?.nickname || user?.username || "a user";

    const newOrder = new SellOrder({ userId, amount, price, krwAmount });
    await newOrder.save();

    const message = `New sell order created by ${userName}: ${amount} USDT at price ${price} KRW (Total: ${krwAmount} KRW).`;
    const type = "sellOrder";
    const referenceId = newOrder._id;

    await createNewAdminNotification(message, userId, type, referenceId);

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

export const getAllInProgressApprovalOrders = async (req, res) => {
  try {
    const onSaleStatus = "In Progress";

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
    const onSaleStatuses = ["On Sale", "Partially Matched"]; // An array of statuses

    // Use the $in operator to check if the status is one of the desired statuses
    const onSaleSellOrders = await SellOrder.find({
      status: { $in: onSaleStatuses },
    }).populate(
      "userId",
      "username nickname fullName phone bankName bankAccount"
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

// export const getAllCompletedMatchedOrders = async (req, res) => {
//   try {
//     // Define completed statuses for sell and buy
//     const completedSellStatus = "Sale Completed";
//     const completedBuyStatus = "Buy Completed";

//     // Fetch completed sell orders with user info and matched buy orders populated
//     const completedSellOrders = await SellOrder.find({
//       status: completedSellStatus,
//     })
//       .populate(
//         "userId",
//         "username nickname fullName phone bankName bankAccount"
//       )
//       .populate({
//         path: "matchedBuyOrders.orderId", // Populating matchedBuyOrders
//         select: "userId amount price status", // Fields to populate from BuyOrder
//       })
//       .sort({ createdAt: -1 });

//     // Fetch completed buy orders with user info and matched sell orders populated
//     const completedBuyOrders = await BuyOrder.find({
//       status: completedBuyStatus,
//     })
//       .populate(
//         "userId",
//         "username nickname fullName phone bankName bankAccount"
//       )
//       .populate({
//         path: "matchedSellOrders.orderId", // Populating matchedSellOrders
//         select: "userId amount price status", // Fields to populate from SellOrder
//       })
//       .sort({ createdAt: -1 });

//     // Optionally, you can merge and sort both lists by createdAt descending
//     // If you want a single combined list sorted by date:
//     const combinedOrders = [...completedSellOrders, ...completedBuyOrders].sort(
//       (a, b) => b.createdAt - a.createdAt
//     );
//     console.log(JSON.stringify(combinedOrders, null, 2));

//     // Send the result as response
//     res.json(
//       combinedOrders // optional
//     );
//     // buyOrders: completedBuyOrders,
//     // sellOrders: completedSellOrders,
//   } catch (error) {
//     console.error("Error fetching completed orders:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

export const getAllCompletedMatchedOrders = async (req, res) => {
  try {
    const completedSellStatus = "Sale Completed";
    const completedBuyStatus = "Buy Completed";

    // 1. Fetch Sell Orders (now no need to populate userId for nickname)
    const completedSellOrders = await SellOrder.find({
      status: completedSellStatus,
    })
      .populate({
        path: "matchedBuyOrders.orderId",
        select: "buyerNickname buyerPhone fee amount", // assuming buyerNickname now exists on BuyOrder
      })
      .sort({ createdAt: -1 });
    console.log(
      "🚀 ~ getAllCompletedMatchedOrders ~ completedSellOrders:",
      completedSellOrders
    );

    // 2. Fetch Buy Orders (now no need to populate userId for nickname)
    const completedBuyOrders = await BuyOrder.find({
      status: completedBuyStatus,
    })
      .populate({
        path: "matchedSellOrders.orderId",
        select: "sellerNickname sellerPhone amount",
      })
      .sort({ createdAt: -1 });

    // 3. Transform Sell Orders
    const sell = completedSellOrders.map((order) => {
      const progressRecords = order.matchedBuyOrders.map((match) => ({
        type: "Buy",
        amount: `${match.amount} USDT`,
        nickname: match.orderId?.buyerNickname || "N/A",
        phone: match.orderId?.buyerPhone || "N/A",
        fee: match.orderId?.fee ? `${match.orderId.fee} USDT` : null,
      }));

      const buyerFromMatch = progressRecords[0]?.nickname || "N/A";
      const buyerPhoneFromMatch = progressRecords[0]?.phone || "N/A";

      return {
        postingNumber: `SL-${order._id.toString().slice(-6).toUpperCase()}`,
        buyer: buyerFromMatch,
        seller: order?.sellerNickname || "N/A",
        phone: order?.sellerPhone || "N/A",
        amount: `${order.amount} USDT`,
        status: "Completed",
        details: {
          buyerNickname: buyerFromMatch,
          buyerPhone: buyerPhoneFromMatch,
          buyRequestAmount: `${order.amount} USDT`,
          progressRecords,
          registrationDate: new Date(order.createdAt).toLocaleString(),
          completionDate: new Date(order.updatedAt).toLocaleString(),
        },
      };
    });

    console.log("🚀 ~ sell ~ sell:", sell);

    // 4. Transform Buy Orders
    const buy = completedBuyOrders.map((order) => {
      const progressRecords = order.matchedSellOrders.map((match) => ({
        type: "Sell",
        amount: `${match.amount} USDT`,
        nickname: match.orderId?.sellerNickname || "N/A",
        fee: null,
      }));

      progressRecords.push({
        type: "Buy",
        amount: `${order.amount} USDT`,
        nickname: order.buyerNickname || "N/A",
        fee: order.fee ? `${order.fee} USDT` : null,
      });

      const sellerFromMatch =
        progressRecords.find((r) => r.type === "Sell")?.nickname || "N/A";

      return {
        postingNumber: `BY-${order._id.toString().slice(-6).toUpperCase()}`,
        buyer: order.buyerNickname || "N/A",
        seller: sellerFromMatch,
        amount: `${order.amount} USDT`,
        status: "Completed",
        details: {
          buyerNickname: order.buyerNickname || "N/A",
          buyerPhone: order.buyerPhone || "N/A",
          buyRequestAmount: `${order.amount} USDT`,
          progressRecords,
          registrationDate: new Date(order.createdAt).toLocaleString(),
          completionDate: new Date(order.updatedAt).toLocaleString(),
        },
      };
    });

    return res.status(200).json({ sell, buy });
  } catch (error) {
    console.error("Error fetching matched orders:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const completeOrders = async (req, res) => {
  try {
    const { buyerOrderId, sellerOrderId } = req.body;
   

    const buyOrderMatches = buyerOrderId;

    // 1. Fetch sell order
    const sellOrder = await SellOrder.findById(sellerOrderId).populate(
      "userId",
      "nickname"
    );
    if (!sellOrder)
      return res.status(404).json({ error: "Sell order not found" });

    // Ensure sell order is in progress
    if (sellOrder.status !== "In Progress") {
      return res.status(400).json({
        error: "Sell order is not in progress and cannot be completed",
      });
    }

    // 2. Fetch the buy order based on the buyerOrderId
    const buyOrder = await BuyOrder.findById(buyerOrderId).populate(
      "userId",
      "nickname"
    );
    if (!buyOrder) {
      return res.status(404).json({ error: "Buy order not found" });
    }

    // Ensure buy order is in progress
    if (buyOrder.status !== "In Progress") {
      return res.status(400).json({
        error: "Buy order is not in progress and cannot be completed",
      });
    }

    // 3. Ensure the match amount doesn't exceed available amounts
    const matchAmount = Math.min(
      buyOrder.amountRemaining,
      sellOrder.amountRemaining
    );
    console.log("🚀 ~ matchOrders ~ matchAmount:", matchAmount);

    if (matchAmount <= 0) {
      console.log("🚀 ~ matchOrders ~ matchAmount:", matchAmount);
      return res.status(400).json({ error: "No available amount to match" });
    }

    // Only deduct fee once per buy order
    let fee = 0;
    if (!buyOrder.feeDeducted) {
      fee = +(matchAmount * 0.01).toFixed(6); // 1% fee
      buyOrder.fee = (buyOrder.fee || 0) + fee;
      buyOrder.feeDeducted = true; // Mark fee as deducted
    }

    // 4. Process the match: Update both buy and sell orders
    // Update buy order
    buyOrder.amountRemaining -= matchAmount + fee;
    buyOrder.matchedSellOrders.push({
      orderId: sellOrder._id,
      matchModel: "SellOrder",
      amount: matchAmount,
      fee,
    });

    buyOrder.status =
      buyOrder.amountRemaining === 0 ? "Buy Completed" : "Partially Matched";
    buyOrder.currentSellOrderInProgress = null;
    await buyOrder.save();

    // Update sell order
    sellOrder.amountRemaining -= matchAmount;
    sellOrder.matchedBuyOrders.push({
      orderId: buyOrder._id,
      matchModel: "BuyOrder",
      amount: matchAmount,
    });
    sellOrder.status =
      sellOrder.amountRemaining === 0 ? "Sale Completed" : "Partially Matched";
    sellOrder.currentBuyOrderInProgress = null;
    await sellOrder.save();

    // If there is remaining amount in the buy order, it can be matched with another sell order later.
    if (buyOrder.amountRemaining > 0) {
      // Optionally, you can flag this remaining amount in the buy order so that it can be used for future matching
      console.log(
        `Buy order ${buyerOrderId} still has remaining amount: ${buyOrder.amountRemaining}`
      );
    }

    // Craft notification messages using nicknames
    const sellUserName = sellOrder.userId?.nickname || "Seller";
    const buyUserName = buyOrder.userId?.nickname || "Buyer";

    const sellerMsg = `Your sell order of ${matchAmount} USDT has been matched and completed with buyer ${buyUserName}.`;
    const buyerMsg = `Your buy order of ${matchAmount} USDT has been matched and completed with seller ${sellUserName}.`;

    // Send notifications to seller and buyer
    await Promise.all([
      createNewUserNotification(
        sellerMsg,
        sellOrder.userId,
        "sellOrder",
        sellOrder._id
      ),
      createNewUserNotification(
        buyerMsg,
        buyOrder.userId,
        "buyOrder",
        buyOrder._id
      ),
    ]);

    // 5. Notify users or handle other business logic here
    res.json({ message: "Orders completed successfully", buyOrder, sellOrder });

    // 4. Notify users or handle other business logic here
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const matchOrders = async (req, res) => {
  try {
    const { buyerOrderId, sellerOrderId } = req.body;

    // Fetch sell order
    const sellOrder = await SellOrder.findById(sellerOrderId).populate(
      "userId",
      "nickname"
    );
    if (!sellOrder)
      return res.status(404).json({ error: "Sell order not found" });

    if (!["On Sale", "Partially Matched"].includes(sellOrder.status)) {
      return res
        .status(400)
        .json({ error: "Sell order not available for matching" });
    }

    // Check if sellOrder is already locked with another buy order
    if (
      sellOrder.currentBuyOrderInProgress &&
      sellOrder.currentBuyOrderInProgress.toString() !== buyerOrderId
    ) {
      return res.status(400).json({
        error: "Sell order is already matched with another buy order",
      });
    }

    // Fetch buy order
    const buyOrder = await BuyOrder.findById(buyerOrderId).populate(
      "userId",
      "nickname"
    );
    if (!buyOrder) {
      return res.status(404).json({ error: "Buy order not found" });
    }

    if (
      !["On Sale", "Partially Matched", "Waiting for Buy"].includes(
        buyOrder.status
      )
    ) {
      return res
        .status(400)
        .json({ error: "Buy order not available for matching" });
    }

    // Check if buyOrder is already locked with another sell order
    if (
      buyOrder.currentSellOrderInProgress &&
      buyOrder.currentSellOrderInProgress.toString() !== sellerOrderId
    ) {
      return res.status(400).json({
        error: "Buy order is already matched with another sell order",
      });
    }

    // Lock the orders to each other and set status to In Progress
    sellOrder.currentBuyOrderInProgress = buyOrder._id;
    sellOrder.status = "In Progress";

    buyOrder.currentSellOrderInProgress = sellOrder._id;
    buyOrder.status = "In Progress";

    await buyOrder.save();
    await sellOrder.save();

    // Craft notification messages using nicknames
    const sellUserName = sellOrder.userId?.nickname || "Seller";
    const buyUserName = buyOrder.userId?.nickname || "Buyer";

    const sellerMsg = `Your sell order of ${sellOrder.amountRemaining} USDT has been matched with buyer ${buyUserName}.`;
    const buyerMsg = `Your buy order of ${buyOrder.amountRemaining} USDT has been matched with seller ${sellUserName}.`;

    // Send notifications to seller and buyer
    await Promise.all([
      createNewUserNotification(
        sellerMsg,
        sellOrder.userId,
        "sellOrder",
        sellOrder._id
      ),
      createNewUserNotification(
        buyerMsg,
        buyOrder.userId,
        "buyOrder",
        buyOrder._id
      ),
    ]);

    res.json({
      message: "Orders matched successfully, trade is In Progress",
      sellOrder,
      buyOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const cancelTrade = async (req, res) => {
  try {
    const {  buyerOrderId, sellerOrderId  } = req.body;
     

    const sellOrder = await SellOrder.findById(sellerOrderId).populate(
      "userId",
      "nickname"
    );
    const buyOrder = await BuyOrder.findById(buyerOrderId).populate(
      "userId",
      "nickname"
    );

    if (!sellOrder || !buyOrder) {
      return res.status(404).json({ error: "Orders not found" });
    }

    if (
      sellOrder.status !== "In Progress" ||
      buyOrder.status !== "In Progress"
    ) {
      return res.status(400).json({ error: "Trade not in progress" });
    }

    // Reset statuses to allow re-matching or cancelling
    sellOrder.status =
      sellOrder.amountRemaining === sellOrder.amount
        ? "On Sale"
        : "Partially Matched";
    buyOrder.status =
      buyOrder.amountRemaining === buyOrder.amount
        ? "Waiting for Buy"
        : "Partially Matched";

    // CLEAR the "in progress" locks
    sellOrder.currentBuyOrderInProgress = null;
    buyOrder.currentSellOrderInProgress = null;

    await sellOrder.save();
    await buyOrder.save();

    // Craft notification messages using nicknames
    const sellUserName = sellOrder.userId?.nickname || "Seller";
    const buyUserName = buyOrder.userId?.nickname || "Buyer";

    const sellerMsg = `Your sell order of ${sellOrder.amountRemaining} USDT has been cancelled with buyer ${buyUserName}.`;
    const buyerMsg = `Your buy order of ${buyOrder.amountRemaining} USDT has been cancelled with seller ${sellUserName}.`;

    console.log("🚀 ~ cancelTrade ~ buyerMsg:", buyerMsg)
    // Send notifications to seller and buyer
    await Promise.all([
      createNewUserNotification(
        sellerMsg,
        sellOrder.userId,
        "sellOrder",
        sellOrder._id
      ),
      createNewUserNotification(
        buyerMsg,
        buyOrder.userId,
        "buyOrder",
        buyOrder._id
      ),
    ]);

    console.log("🚀 ~ cancelTrade ~ sellOrder:", sellOrder)
    res.json({
      message: "Trade cancelled and orders restored",
      sellOrder,
      buyOrder,
    });
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

export const getAdminDashboardStats = async (req, res) => {
  try {
    // Count users
    const userCountPromise = userModel.countDocuments();

    // Total sale amount from completed sell orders
    const totalSalesPromise = SellOrder.aggregate([
      { $match: { status: "Sale Completed" } },
      { $group: { _id: null, totalSalesAmount: { $sum: "$amount" } } },
    ]);

    // Total buy amount from completed buy orders
    const totalBuysPromise = BuyOrder.aggregate([
      { $match: { status: "Buy Completed" } },
      { $group: { _id: null, totalBuyAmount: { $sum: "$amount" } } },
    ]);

    // Total fee from completed buy orders
    const totalFeesPromise = BuyOrder.aggregate([
      { $match: { status: "Buy Completed", fee: { $ne: null } } },
      { $group: { _id: null, totalFees: { $sum: "$fee" } } },
    ]);

    // Await all promises
    const [userCount, sales, buys, fees] = await Promise.all([
      userCountPromise,
      totalSalesPromise,
      totalBuysPromise,
      totalFeesPromise,
    ]);

    res.json({
      users: userCount,
      totalSales: sales[0]?.totalSalesAmount || 0,
      totalBuys: buys[0]?.totalBuyAmount || 0,
      totalFees: fees[0]?.totalFees || 0,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin dashboard stats" });
  }
};
