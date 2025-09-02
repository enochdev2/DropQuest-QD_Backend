import mongoose from "mongoose";
const Schema = mongoose.Schema;

const tokenSlotsSchema = new Schema(
  {
    slotId: {
      type: Number,
      required: true,
    },
    tokenName: {
      type: String,
      enum: ["GLM", "BTC"],
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

export const tokenSlotsModel = mongoose.model("TokenSlots", tokenSlotsSchema);
