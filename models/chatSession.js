import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  isClosed: {
    type: Boolean,
    default: false,
  },
  closedAt: {
    type: Date,
  },
});

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
