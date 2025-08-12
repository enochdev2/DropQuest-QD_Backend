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
    const userId = req.user.id;

    const { amount, price, krwAmount, storedLanguage } = req.body;

    const user = await userModel
      .findById(userId)
      .select("nickname username phone status")
      .lean();

    if (user.status === "inactive")
      return res
        .status(404)
        .json({ error: "User Must be verified before placing an  Order" });

    const userName = user?.nickname || user?.username || "a user";

    const newOrder = new SellOrder({
      userId,
      sellerNickname: user.nickname,
      sellerPhone: user.phone,
      amount,
      amountRemaining: amount,
      krwAmount,
      price,
    });
    await newOrder.save();

    let message;

    if (storedLanguage === "ko") {
      message = ` ${userName}님이 새로운 판매 주문을 생성했습니다: ${amount} USDT / 총액 ${krwAmount} KRW `;
    } else {
      message = `New sell order created by ${userName}: ${amount} USDT (Total: ${krwAmount} KRW).`;
    }
    const type = "sellOrder";
    const referenceId = newOrder._id;

    console.log("🚀 ~ createSellOrder ~ message:", message);
    await createNewAdminNotification(message, userId, type, referenceId);

    await createNewAdminNotification(
      message,
      userId,
      "sellOrder",
      newOrder._id
    );
    const messages =
      storedLanguage === "ko"
        ? ` $ ${amount}의 구매 주문을 성공적으로 등록하였습니다.`
        : `you have successful placed a sell order of $ ${amount}.`;
    await createNewUserNotification(
      messages,
      userId,
      "sellOrder",
      newOrder._id
    );

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating sell order or notification:", error);
    res.status(500).json({ error: error.message });
  }
};

export const cancelSellOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { storedLanguage } = req.body;
    console.log("🚀 ~ cancelSellOrder ~ storedLanguage:", storedLanguage);

    const { admin } = req.user;

    const query = {
      _id: orderId,
      ...(admin ? {} : { userId }),
      status: {
        $in: admin
          ? ["Waiting for Buy", "Pending Approval"]
          : ["Pending Approval"],
      },
    };

    const order = await SellOrder.findOne(query);

    if (!order) {
      return res
        .status(404)
        .json({ error: "Order not found or cannot be cancelled" });
    }

    // Remove the order
    await SellOrder.findByIdAndDelete(orderId);

    let message;
    storedLanguage === "ko"
      ? (message = `판매 주문 #${orderId}가 취소되었습니다 `)
      : (message = `Your sell order #${orderId} has been cancelled.`);

    // Notify user
    await createNewUserNotification(message, userId, "sellOrder", orderId);

    res.json({ message: "Sell order cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const admindeletSellOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, nickname, storedLanguage } = req.params;

    const { admin } = req.user;

    const order = await SellOrder.findById(orderId);
    console.log("🚀 ~ cancelSellOrder ~ order:", order);

    if (!order) {
      return res
        .status(404)
        .json({ error: "Order not found or cannot be cancelled" });
    }

    // Remove the order
    await SellOrder.findByIdAndDelete(orderId);

    let message;
    storedLanguage === "ko"
      ? (message = `판매 주문 #${orderId}가 취소되었습니다 `)
      : (message = `Your sell order #${orderId} has been cancelled.`);

    // Notify user
    await createNewUserNotification(message, userId, "sellOrder", orderId);

    res.json({ message: "Sell order cancelled successfully" });
  } catch (error) {
    console.log("🚀 ~ admindeletSellOrder ~ error.message:", error.message);
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
    const { orderId, storedLanguage } = req.params;

    const order = await SellOrder.findById(orderId);
    console.log("🚀 ~ approveSellOrder ~ order:", order);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = "On Sale";
    order.amountRemaining = order.amount;
    await order.save();

    let message;
    storedLanguage === "ko"
      ? (message = `판매 주문 #${orderId}가 승인되어 판매 중입니다 `)
      : (message = ` Your sell order #${orderId} has been approved and is now On Sale.`);
    // Notify user
    await createNewUserNotification(
      message,
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
    const { orderId, storedLanguage } = req.params;

    const order = await SellOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // You might want to delete or mark rejected orders differently
    await order.deleteOne();

    let message;
    storedLanguage === "ko"
      ? (message = `판매 주문 #${orderId}가 거절되었습니다. `)
      : (message = ` Your sell order #${orderId} has been rejected.`);

    // Notify user about rejection
    await createNewUserNotification(
      message,
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

export const getUserInProgressOrders = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated user's ID
    const inProgressStatus = "In Progress";

    // Find all sell orders by this user that are currently "In Progress"
    const inProgressOrders = await SellOrder.find({
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
    // const onSaleStatus = "In Progress";
    const statuses = ["In Progress", "Partially Matched"];

    const onSaleSellOrders = await SellOrder.find({ status: { $in: statuses } })
      .populate(
        "userId",
        "username nickname fullName phone bankName bankAccount"
      )
      .populate({
        path: "matchedBuyOrders.orderId", // << this populates BuyOrder via dynamic refPath
        model: "BuyOrder",
        select: "buyerNickname", // pull nickname from BuyOrder
      })
      .populate({
        path: "currentBuyOrderInProgress",
        model: "BuyOrder",
        select: "buyerNickname userId", // also fetch userId to go deeper
        populate: {
          path: "userId",
          model: "User",
          select: "username nickname phone", // buyer's full info
        },
      })
      .sort({ createdAt: -1 });

    const sellOrders = onSaleSellOrders;
    console.log(JSON.stringify(sellOrders, null, 2));

    res.json(sellOrders);
  } catch (error) {
    console.error("Error fetching on-sale sell orders:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllOnSaleOrders = async (req, res) => {
  try {
    const onSaleStatuses = ["On Sale"]; // An array of statuses

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
        model: "BuyOrder", // 👈 This forces population using the correct schema
        select: "buyerNickname buyerPhone fee amount",
      })
      .sort({ createdAt: -1 });

    // console.log(JSON.stringify(completedSellOrders, null, 2));

    // 2. Fetch Buy Orders (now no need to populate userId for nickname)
    const completedBuyOrders = await BuyOrder.find({
      status: completedBuyStatus,
    })
      .populate({
        path: "matchedSellOrders.orderId",
        model: "SellOrder",
        select: "sellerNickname sellerPhone amount",
      })
      .sort({ createdAt: -1 });

    // 3. Transform Sell Orders
    const sell = completedSellOrders.map((order) => {
      const progressRecords = order.matchedBuyOrders.flatMap((match) => {
        const buyerNickname = match.orderId?.buyerNickname || "N/A";
        const buyerPhone = match.orderId?.buyerPhone || "N/A";
        const sellerNickname = order.sellerNickname || "N/A";
        const sellerPhone = order.sellerPhone || "N/A";
        const amount = match.amount;
        const fee = match.orderId?.fee ? `${match.orderId.fee} USDT` : null;

        return [
          {
            type: "Sell",
            amount: `${amount} USDT`,
            nickname: sellerNickname,
            phone: sellerPhone,
            fee: null,
          },
          {
            type: "Buy",
            amount: `${amount} USDT`,
            nickname: buyerNickname,
            phone: buyerPhone,
            fee,
          },
        ];
      });

      const buyerFromMatch = progressRecords[0]?.nickname || "N/A";
      const buyerPhoneFromMatch = progressRecords[0]?.phone || "N/A";

      return {
        postingNumber: `SL-${order._id.toString()}`,
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

    console.log(JSON.stringify(sell, null, 2));

    // 4. Transform Buy Orders
    const buy = completedBuyOrders.map((order) => {
      const progressRecords = order.matchedSellOrders.flatMap((match) => {
        const amount = match.amount;
        const sellerNickname = match.orderId?.sellerNickname || "N/A";
        const sellerPhone = match.orderId?.sellerPhone || "N/A";
        const buyerNickname = order.buyerNickname || "N/A";
        const buyerPhone = order.buyerPhone || "N/A";
        const fee = (amount * 0.01).toFixed(6) + " USDT"; // Or use match.orderId.fee if provided

        return [
          {
            type: "Sell",
            amount: `${amount} USDT`,
            nickname: sellerNickname,
            phone: sellerPhone,
            fee: null,
          },
          {
            type: "Buy",
            amount: `${amount} USDT`,
            nickname: buyerNickname,
            phone: buyerPhone,
            fee,
          },
        ];
      });

      const sellerFromMatch =
        progressRecords.find((r) => r.type === "Sell")?.nickname || "N/A";

      return {
        postingNumber: `BY-${order._id.toString()}`,
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
    const { buyerOrderId, sellerOrderId, storedLanguage } = req.body;
    console.log("🚀 ~ completeOrders ~ storedLanguage:", storedLanguage)

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
    // let feeSubtracted = matchAmount - fee
    // buyOrder.amountRemaining -= feeSubtracted;
    buyOrder.amountRemaining -= matchAmount;
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

    const sellerMsg =
      storedLanguage === "ko"
        ? `${matchAmount} USDT 판매 주문이 구매자 ${buyUserName}님과 매칭되어 완료되었습니다.`
        : `Your sell order of ${matchAmount} USDT has been matched and completed with buyer ${buyUserName}.`;

    const buyerMsg =
      storedLanguage === "ko"
        ? `${matchAmount} USDT 구매 주문이 판매자 ${sellUserName}님과 매칭되어 완료되었습니다.`
        : `Your buy order of ${matchAmount} USDT has been matched and completed with seller ${sellUserName}.`;

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

// export const matchOrders = async (req, res) => {
//   try {
//     const { buyerOrderId, sellerOrderId } = req.body;

//     // Fetch sell order
//     const sellOrder = await SellOrder.findById(sellerOrderId).populate(
//       "userId",
//       "nickname"
//     );
//     if (!sellOrder)
//       return res.status(404).json({ error: "Sell order not found" });

//     if (!["On Sale", "Partially Matched"].includes(sellOrder.status)) {
//       return res
//         .status(400)
//         .json({ error: "Sell order not available for matching" });
//     }

//     // Check if sellOrder is already locked with another buy order
//     if (
//       sellOrder.currentBuyOrderInProgress &&
//       sellOrder.currentBuyOrderInProgress.toString() !== buyerOrderId
//     ) {
//       return res.status(400).json({
//         error: "Sell order is already matched with another buy order",
//       });
//     }

//     // Fetch buy order
//     const buyOrder = await BuyOrder.findById(buyerOrderId).populate(
//       "userId",
//       "nickname"
//     );
//     if (!buyOrder) {
//       return res.status(404).json({ error: "Buy order not found" });
//     }

//     if (
//       !["On Sale", "Partially Matched", "Waiting for Buy"].includes(
//         buyOrder.status
//       )
//     ) {
//       return res
//         .status(400)
//         .json({ error: "Buy order not available for matching" });
//     }

//     // Check if buyOrder is already locked with another sell order
//     if (
//       buyOrder.currentSellOrderInProgress &&
//       buyOrder.currentSellOrderInProgress.toString() !== sellerOrderId
//     ) {
//       return res.status(400).json({
//         error: "Buy order is already matched with another sell order",
//       });
//     }

//     // Lock the orders to each other and set status to In Progress
//     sellOrder.currentBuyOrderInProgress = buyOrder._id;
//     sellOrder.status = "In Progress";

//     buyOrder.currentSellOrderInProgress = sellOrder._id;
//     buyOrder.status = "In Progress";

//     await buyOrder.save();
//     await sellOrder.save();

//     // Craft notification messages using nicknames
//     const sellUserName = sellOrder.userId?.nickname || "Seller";
//     const buyUserName = buyOrder.userId?.nickname || "Buyer";

//     const sellerMsg = `Your sell order of ${sellOrder.amountRemaining} USDT has been matched with buyer ${buyUserName}.`;
//     const buyerMsg = `Your buy order of ${buyOrder.amountRemaining} USDT has been matched with seller ${sellUserName}.`;

//     // Send notifications to seller and buyer
//     await Promise.all([
//       createNewUserNotification(
//         sellerMsg,
//         sellOrder.userId,
//         "sellOrder",
//         sellOrder._id
//       ),
//       createNewUserNotification(
//         buyerMsg,
//         buyOrder.userId,
//         "buyOrder",
//         buyOrder._id
//       ),
//     ]);

//     res.json({
//       message: "Orders matched successfully, trade is In Progress",
//       sellOrder,
//       buyOrder,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

export const matchOrders = async (req, res) => {
  try {
    const { buyerOrderId, sellerOrderId, storedLanguage } = req.body;

    // Fetch sell order and populate the nickname of the seller
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

    // Fetch buy order and populate the nickname of the buyer
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

    // Ensure the buyer's and seller's nicknames are different
    const buyerNickname = buyOrder.userId?.nickname;
    const sellerNickname = sellOrder.userId?.nickname;

    if (buyerNickname === sellerNickname) {
      return res.status(400).json({
        error: "These orders were created from the same account.",
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
    const sellerMsg =
      storedLanguage === "ko"
        ? ` ${sellOrder.amountRemaining} USDT 판매 주문이 구매자 ${buyerNickname}님과 매칭되었습니다.`
        : `Your sell order of ${sellOrder.amountRemaining} USDT has been matched with buyer ${buyerNickname}.`;

    const buyerMsg =
      storedLanguage === "ko"
        ? ` ${buyOrder.amountRemaining} USDT 구매 주문이 판매자 ${sellerNickname}님과 매칭되었습니다.`
        : `Your buy order of ${buyOrder.amountRemaining} USDT has been matched with seller ${sellerNickname}.`;

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
    const { buyerOrderId, sellerOrderId, storedLanguage } = req.body;

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

    const sellerMsg =
      storedLanguage === "ko"
        ? `${sellOrder.amountRemaining} USDT 판매 주문이 구매자 ${buyUserName}님과 함께 취소되었습니다.`
        : `Your sell order of ${sellOrder.amountRemaining} USDT has been cancelled with buyer ${buyUserName}.`;

    const buyerMsg =
      storedLanguage === "ko"
        ? `${buyOrder.amountRemaining} USDT 구매 주문이 판매자 ${sellUserName}님과 함께 취소되었습니다.`
        : `Your buy order of ${buyOrder.amountRemaining} USDT has been cancelled with seller ${sellUserName}.`;

    console.log("🚀 ~ cancelTrade ~ buyerMsg:", buyerMsg);
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

    console.log("🚀 ~ cancelTrade ~ sellOrder:", sellOrder);
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
export const getManagerDashboardStat = async (req, res) => {
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

export const getManagerDashboardStats = async (req, res) => {
  try {
     // Get the userId of the logged-in user (assumed to be the manager)
    const userId = req.user.id;

    // Fetch the user document to get the manager's referral code
    const user = await userModel
      .findById(userId)
      .select("referralCode");

    // Check if the user exists and has a referralCode
    if (!user || !user.referralCode) {
      return res.status(404).json({ error: "Manager not found or missing referral code" });
    }

    const managerReferralCode = user.referralCode

    // 1. Count users who are not managers and have the same referral code as the manager
    const userCountPromise = userModel.countDocuments({
      referralCode: managerReferralCode,
      admin: { $ne: true }  // Exclude managers (admin: true)
    });

    // 2. Total sale amount from completed sell orders where the user is referred by the manager
    const totalSalesPromise = SellOrder.aggregate([
      { $match: { status: "Sale Completed" } },
      { $lookup: {
        from: "users", 
        localField: "userId", 
        foreignField: "_id", 
        as: "user"
      }},
      { $unwind: "$user" },
      { $match: { "user.referralCode": managerReferralCode } },  // Filter by manager's referral code
      { $group: { _id: null, totalSalesAmount: { $sum: "$amount" } } }
    ]);

    // 3. Total buy amount from completed buy orders where the user is referred by the manager
    const totalBuysPromise = BuyOrder.aggregate([
      { $match: { status: "Buy Completed" } },
      { $lookup: {
        from: "users", 
        localField: "userId", 
        foreignField: "_id", 
        as: "user"
      }},
      { $unwind: "$user" },
      { $match: { "user.referralCode": managerReferralCode } },  // Filter by manager's referral code
      { $group: { _id: null, totalBuyAmount: { $sum: "$amount" } } }
    ]);

    // 4. Total fee from completed buy orders where the user is referred by the manager
    const totalFeesPromise = BuyOrder.aggregate([
      { $match: { status: "Buy Completed", fee: { $ne: null } } },
      { $lookup: {
        from: "users", 
        localField: "userId", 
        foreignField: "_id", 
        as: "user"
      }},
      { $unwind: "$user" },
      { $match: { "user.referralCode": managerReferralCode } },  // Filter by manager's referral code
      { $group: { _id: null, totalFees: { $sum: "$fee" } } }
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
    res.status(500).json({ error: "Failed to fetch manager dashboard stats" });
  }
};

