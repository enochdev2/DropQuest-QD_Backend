import mongoose from "mongoose";
const Schema = mongoose.Schema;

const tokenSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TokenSlots",
      required: true,
    },
    tokenName: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: true,
    },
    pointRatio: {
      type: String, // e.g. "$GLM" or "$???"
      default: "$???",
    },
    pointExchanged: {
      type: Number, // 
      default: 0,
    },
    isConfigured: {
      type: Boolean,
      default: false,
    },
    img: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const tokenModel = mongoose.model("Token", tokenSchema);
