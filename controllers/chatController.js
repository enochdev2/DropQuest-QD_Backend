import { ChatModel } from "../models/chatModel.js";
import { ChatSession } from "../models/chatSession.js";









export const saveMessage = async (req, res) => {
  try {
    const { orderId, sender, content } = req.body;

    const chat = await ChatSession.findOne({ orderId });
    if (chat?.isClosed) {
      return res.status(403).json({ message: "Chat is closed." });
    }

    const message =  new ChatModel({ orderId, sender, content });
    await message.save();
    console.log("🚀 ~ saveMessage ~ message:", message)
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await ChatModel.find({ orderId: req.params.orderId }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const closeChat = async (req, res) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { orderId: req.params.orderId },
      { isClosed: true, closedAt: new Date() },
      { upsert: true, new: true }
    );
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
