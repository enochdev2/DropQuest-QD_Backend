import mongoose from "mongoose";

const archivedChatSessionSchema = new mongoose.Schema({
  orderId: {
    type: String,
    // unique: true,
    // required: true,
  },
  currentOrderInProgress: {
    type: String,
    // unique: true,
    // required: false,
  },
  orderType: {
    // New field added to differentiate between buy and sell
    type: String,
    enum: ["buy", "sell"],
    required: true,
  },
  nickname: {
    type: String,
    required: false,
  },
  fullName: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  bankName: {
    type: String,
    required: false,
  },
  bankAccount: {
    type: Number,
    required: false,
  },
  tetherAddress: {
    type: String,
    required: false,
  },
  referralCode: {
    type: String,
    required: false,
  },
  isClosed: {
    type: Boolean,
    default: false,
  },
  closedAt: {
    type: Date,
  },
});

export const ArchivedChatSession = mongoose.model(
  "ArchivedChatSession",
  archivedChatSessionSchema
);
