import mongoose from "mongoose";
const { Schema } = mongoose;

const chatSchema = new Schema({
  orderId: {
    type: String,
    required: true,
  },
  sender: {
    type: String, // e.g., "admin" or "user"
    required: true,
  },
  imgage: {
    type: String, 
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const ChatModel = mongoose.model("ChatModel", chatSchema);
