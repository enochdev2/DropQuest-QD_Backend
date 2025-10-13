import mongoose from "mongoose";
const Schema = mongoose.Schema;

const tokenSlotSchema = new Schema(
  {
    slotId: {
      type: Number,
      required: true,
    },
    link: {
      type: String,
      default: " ",
    },
    tokenName: {
      type: String,
      enum: ["GLM", "BTC"],
      required: true,
    },
    token: {
      type: Number,
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    pointRatio: {
      type: String, // e.g. "$GLM" or "$???"
      default: "$???",
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

export const tokenSlotModel = mongoose.model("TokenSlot", tokenSlotSchema);
