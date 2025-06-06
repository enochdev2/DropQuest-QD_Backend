import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
   orderType: {  // New field added to differentiate between buy and sell
    type: String,
    enum: ['buy', 'sell'],  // Can be either 'buy' or 'sell'
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
