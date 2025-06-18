import { BuyOrder } from "../models/buyOrder.js";
import { ChatModel } from "../models/chatModel.js";
import { ChatSession } from "../models/chatSession.js";
import { SellOrder } from "../models/sellOrder.js";
import { createNewAdminNotification } from "./notificationController.js";

export const saveMessage = async (req, res) => {
  try {
    const { orderId,orderType, image, sender, content } = req.body;
    console.log("🚀 ~ saveMessage ~ image:", image)
    const nickname = req.user.nickname;
    const userId = req.user.id
    let chat = await ChatSession.findOne({ orderId });

    console.log("🚀 ~ saveMessage ~ chat:", chat)
   
    // If no session exists, create one with the orderId and orderType
     if (!chat) {
      if (!orderType) {
        return res.status(400).json({ message: "Order type is required to create a new session." });
      }

      chat = new ChatSession({ orderId, orderType, nickname }); // Save orderType (buy/sell)
      await chat.save();
    }

    // If session is closed, block the message
    if (chat.isClosed) {
      return res.status(403).json({ message: "Chat is closed." });
    }

    const message = new ChatModel({ orderId, image, sender, content });
    await message.save();
    console.log("🚀 ~ saveMessage ~ message:", message);
    const messages = `New Chat Session created by ${nickname || "a user"}`;
    await createNewAdminNotification(
      messages,
      userId,
      "chat",
      orderId
    );
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

export const closeChat = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log("🚀 ~ closeChat ~ orderId:", orderId);
    const sessions = await ChatSession.findOneAndUpdate(
      { orderId: orderId },
      { isClosed: true, closedAt: new Date() },
      { upsert: true, new: true }
    );

     await ChatModel.deleteMany({ orderId });
     const session = await ChatSession.findOneAndDelete({ orderId });
     
    res.status(200).json({ message: "Chat closed", session });
  } catch (err) {
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
      .select("orderId orderType nickname isClosed createdAt"); // Select relevant fields to return, including orderType

    res.status(200).json(openChats); // Return open chats with their orderType
  } catch (err) {
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
      buyOrder = await BuyOrder.findById(orderId).populate("userId", "nickname phone bank bankAccount tetherAddress referralCode");
      if (!buyOrder) return res.status(404).json({ error: "Buy order not found" });

      const sellOrderId = BuyOrder.currentSellOrderInProgress;
      if (!sellOrderId) return res.status(404).json({ error: "No linked sell order" });

      sellOrder = await SellOrder.findById(sellOrderId).populate("userId", "nickname phone bank bankAccount tetherAddress referralCode");
      if (!sellOrder) return res.status(404).json({ error: "Linked sell order not found" });
    }

    if (type === "sell") {
      sellOrder = await SellOrder.findById(orderId).populate("userId", "nickname phone bank bankAccount tetherAddress referralCode");
      if (!sellOrder) return res.status(404).json({ error: "Sell order not found" });

      const buyOrderId = sellOrder.currentBuyOrderInProgress;
      if (!buyOrderId) return res.status(404).json({ error: "No linked buy order" });

      buyOrder = await BuyOrder.findById(buyOrderId).populate("userId", "nickname phone bank bankAccount tetherAddress referralCode");
      if (!buyOrder) return res.status(404).json({ error: "Linked buy order not found" });
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


