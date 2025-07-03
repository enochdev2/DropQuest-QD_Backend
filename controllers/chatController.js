import { ArchivedChatModel } from "../models/archivedChatModel.js";
import { ArchivedChatSession } from "../models/archivedChatSession.js";
import { BuyOrder } from "../models/buyOrder.js";
import { ChatModel } from "../models/chatModel.js";
import { ChatSession } from "../models/chatSession.js";
import { SellOrder } from "../models/sellOrder.js";
import { userModel } from "../models/userModel.js";
import { createNewAdminNotification } from "./notificationController.js";

export const saveMessage = async (req, res) => {
  try {
    const { orderId, orderType, image, sender, content } = req.body;
    console.log("🚀 ~ saveMessage ~ image:", image);
    const nickname = req.user.nickname;
    const userId = req.user.id;

    if (!["buy", "sell"].includes(orderType)) {
      return res.status(400).json({ error: "Invalid type parameter" });
    }

    let chat = await ChatSession.findOne({ orderId });

    console.log("🚀 ~ saveMessage ~ chat:", chat);

    // If no session exists, create one with the orderId and orderType
    if (!chat) {
      if (!orderType) {
        return res
          .status(400)
          .json({ message: "Order type is required to create a new session." });
      }

      let buyOrder, sellOrder, user;

      user = await userModel.findOne({ nickname });

      if (orderType === "buy") {
        buyOrder = await BuyOrder.findById(orderId);

        console.log("🚀 ~ saveMessage ~ buyOrder:", buyOrder);

        if (!buyOrder)
          return res.status(404).json({ error: "Buy order not found" });

        const sellOrderId = buyOrder.currentSellOrderInProgress;
        console.log("🚀 ~ saveMessage ~ sellOrderId:", sellOrderId);

        if (!sellOrderId)
          return res.status(404).json({ error: "No linked sell order" });

        sellOrder = await SellOrder.findById(sellOrderId);

        if (!sellOrder)
          return res.status(404).json({ error: "Linked sell order not found" });

        if (buyOrder.userId.toString() !== userId) {
          return res
            .status(403)
            .json({ error: ": Seller must start the chat " });
        }

        chat = new ChatSession({
          orderId,
          orderType,
          nickname,
          username: user.username,
          fullName: user.fullName,
          phone: user.phone,
          bankName: user.bankName,
          bankAccount: user.bankAccount,
          tetherAddress: user.tetherAddress,

          referralCode: user.referralCode,
          currentOrderInProgress: sellOrderId,
        }); // Save orderType (buy/sell)
        await chat.save();
      }

      if (orderType === "sell") {
        sellOrder = await SellOrder.findById(orderId);
        if (!sellOrder)
          return res.status(404).json({ error: "Sell order not found" });

        const buyOrderId = sellOrder.currentBuyOrderInProgress;
        if (!buyOrderId)
          return res.status(404).json({ error: "No linked buy order" });

        buyOrder = await BuyOrder.findById(buyOrderId);

        if (!buyOrder)
          return res.status(404).json({ error: "Linked buy order not found" });

        if (sellOrder.userId.toString() !== userId) {
          return res
            .status(403)
            .json({ error: ": Seller must start the chat " });
        }

        chat = new ChatSession({
          orderId,
          orderType,
          nickname,
          username: user.username,
          fullName: user.fullName,
          phone: user.phone,
          bankName: user.bankName,
          bankAccount: user.bankAccount,
          tetherAddress: user.tetherAddress,
          referralCode: user.referralCode,
          currentOrderInProgress: buyOrderId,
        });
        await chat.save();
      }
    }

    // If session is closed, block the message
    if (chat?.isClosed) {
      return res.status(403).json({ message: "Chat is closed." });
    }

    const message = new ChatModel({
      orderId,
      image,
      sender,
      content,
      timestamp: new Date().toISOString(),
    });
    await message.save();
    const messages = `New Chat Session created by ${nickname || "a user"}`;
    await createNewAdminNotification(messages, userId, "chat", orderId);
    res.status(201).json(message);
  } catch (err) {
    console.error("🔥 Error in saveMessage:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await ChatModel.find({ orderId: req.params.orderId }).sort(
      { timestamp: 1 }
    );
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const adminGetMessages = async (req, res) => {
  try {
    const { orderId } = req.params;

    const messages = await ChatModel.find({ orderId: req.params.orderId }).sort(
      { timestamp: 1 }
    );

    // Fetch chat session details
    const chat = await ChatSession.findOne({ orderId }).select(
      "nickname username phone bankName bankAccount tetherAddress referralCode fullName"
    );

    if (!chat) {
      return res
        .status(404)
        .json({ error: "Chat session not found for this orderId." });
    }

    res.status(200).json({
      chatDetails: chat,
      messages: messages,
    });
  } catch (err) {
    console.error("🔥 Error in getMessages:", err);
    res.status(500).json({ error: err.message });
  }
};

export const adminGetConcludedMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("🚀 ~ adminGetConcludedMessages ~ orderId:", orderId);

    const messages = await ArchivedChatModel.find({
      orderId: req.params.orderId,
    }).sort({ timestamp: 1 });
    console.log("🚀 ~ adminGetConcludedMessages ~ messages:", messages);

    // Fetch chat session details
    const chat = await ArchivedChatSession.findOne({ orderId }).select(
      "nickname username phone bankName bankAccount tetherAddress referralCode fullName"
    );

    if (!chat) {
      return res
        .status(404)
        .json({ error: "Chat session not found for this orderId." });
    }

    res.status(200).json({
      chatDetails: chat,
      messages: messages,
    });
  } catch (err) {
    console.error("🔥 Error in getMessages:", err);
    res.status(500).json({ error: err.message });
  }
};

export const closeChat = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log("🚀 ~ closeChat ~ orderId:", orderId);

    // const chatsSession = await ChatSession.find({ orderId });
    // if (chatsSession.length > 0) {
    //   await ArchivedChatSession.insertMany(chatsSession);
    // }

    const updatedSession = await ChatSession.findOneAndUpdate(
      { orderId: orderId },
      { isClosed: true, closedAt: new Date() },
      { upsert: true, new: true }
    );

    // Step 2: Archive the updated session
    if (updatedSession) {
      const archiveData = updatedSession.toObject();
      delete archiveData._id; // Prevent duplicate key error
      const check = await ArchivedChatSession.create(archiveData);
      // const check = await ArchivedChatSession.create(updatedSession.toObject());
      // console.log("🚀 ~ closeChat ~ check:", check);
    }

    // Step 2: Retrieve all chat messages before deletion
    const chats = await ChatModel.find({ orderId });

    console.log("🚀 ~ closeChat ~ chats:", chats);
    // Step 3: Store them in an archive collection
    if (chats.length > 0) {
      await ArchivedChatModel.insertMany(chats);
    }

    await ChatModel.deleteMany({ orderId });
    const session = await ChatSession.findOneAndDelete({ orderId });

    res.status(200).json({ message: "Chat closed", session });
  } catch (err) {
    console.log("🚀 ~ closeChat ~ err:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getChatStatus = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ orderId: req.params.orderId });
    res.status(200).json({ isClosed: session?.isClosed || false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOpenChats = async (req, res) => {
  try {
    // Fetch all open chats (not closed) and include the orderType field
    const openChats = await ChatSession.find({ isClosed: { $ne: true } })
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .select(
        "orderId orderType nickname username phone bankName bankAccount tetherAddress referralCode currentOrderInProgress isClosed createdAt"
      ); // Select relevant fields to return, including orderType

    res.status(200).json(openChats); // Return open chats with their orderType
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getCloseChats = async (req, res) => {
  try {
    // Fetch all open chats (not closed) and include the orderType field
    const openChats = await ArchivedChatSession.find({
      isClosed: { $ne: false },
    })
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .select(
        "orderId orderType nickname username phone bankName bankAccount tetherAddress referralCode currentOrderInProgress isClosed createdAt"
      ); // Select relevant fields to return, including orderType

    res.status(200).json(openChats); // Return open chats with their orderType
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getChatDetailsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    const chat = await ChatSession.findOne({ orderId }).select(
      "nickname username phone bankName bankAccount tetherAddress referralCode currentOrderInProgress"
    );

    if (!chat) {
      return res
        .status(404)
        .json({ error: "Chat session not found for this orderId." });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error("🔥 Error in getChatDetailsByOrderId:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMatchedOrders = async (req, res) => {
  try {
    const { orderId, type } = req.params;

    if (!["buy", "sell"].includes(type)) {
      return res.status(400).json({ error: "Invalid type parameter" });
    }

    let buyOrder, sellOrder;

    if (type === "buy") {
      buyOrder = await BuyOrder.findById(orderId).populate(
        "userId",
        "nickname phone bank bankAccount tetherAddress referralCode"
      );
      if (!buyOrder)
        return res.status(404).json({ error: "Buy order not found" });

      const sellOrderId = BuyOrder.currentSellOrderInProgress;
      if (!sellOrderId)
        return res.status(404).json({ error: "No linked sell order" });

      sellOrder = await SellOrder.findById(sellOrderId).populate(
        "userId",
        "nickname phone bank bankAccount tetherAddress referralCode"
      );
      if (!sellOrder)
        return res.status(404).json({ error: "Linked sell order not found" });
    }

    if (type === "sell") {
      sellOrder = await SellOrder.findById(orderId).populate(
        "userId",
        "nickname phone bank bankAccount tetherAddress referralCode"
      );
      if (!sellOrder)
        return res.status(404).json({ error: "Sell order not found" });

      const buyOrderId = sellOrder.currentBuyOrderInProgress;
      if (!buyOrderId)
        return res.status(404).json({ error: "No linked buy order" });

      buyOrder = await BuyOrder.findById(buyOrderId).populate(
        "userId",
        "nickname phone bank bankAccount tetherAddress referralCode"
      );
      if (!buyOrder)
        return res.status(404).json({ error: "Linked buy order not found" });
    }

    return res.json({
      message: "Matched orders retrieved successfully",
      buyOrder,
      sellOrder,
    });
  } catch (error) {
    console.error("❌ Error in getMatchedOrders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
