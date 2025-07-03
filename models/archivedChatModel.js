import mongoose from "mongoose";
const { Schema } = mongoose;

const archivedChatSchema = new Schema({
  orderId: {
    type: String,
    required: true,
  },
  sender: {
    type: String, // e.g., "admin" or "user"
    required: true,
  },
  image: String,
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const ArchivedChatModel = mongoose.model("ArchivedChatModel", archivedChatSchema);
