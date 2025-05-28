import mongoose from "mongoose";
const Schema = mongoose.Schema;

const sellOrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  krwAmount: { type: Number, required: true },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending Approval", "On Sale", "Sale Completed"],
    default: "Pending Approval",
  },
  matchedBuyOrder: { type: Schema.Types.ObjectId, ref: "BuyOrder", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const SellOrder = mongoose.model("SellOrder", sellOrderSchema);
