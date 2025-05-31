import { ChatModel } from "../models/chatModel.js";
import { ChatSession } from "../models/chatSession.js";
import { createNewAdminNotification } from "./notificationController.js";

export const saveMessage = async (req, res) => {
  try {
    const { orderId, sender, content } = req.body;
    const nickname = req.user.nickname;
    const userId = req.user.id
    let chat = await ChatSession.findOne({ orderId });

    // If no session, create one
    if (!chat) {
      chat = new ChatSession({ orderId, participants: [sender] });
      await chat.save();
    }

    // If session is closed, block the message
    if (chat.isClosed) {
      return res.status(403).json({ message: "Chat is closed." });
    }

    const message = new ChatModel({ orderId, sender, content });
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
    const session = await ChatSession.findOneAndUpdate(
      { orderId: orderId },
      { isClosed: true, closedAt: new Date() },
      { upsert: true, new: true }
    );

     await ChatModel.deleteMany({ orderId });
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
    const openChats = await ChatSession.find({ isClosed: { $ne: true } }).sort({
      createdAt: -1,
    });

    res.status(200).json(openChats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
