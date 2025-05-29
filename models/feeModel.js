import mongoose from "mongoose";
const { Schema } = mongoose;

const transactionFeeSchema = new Schema({
  buyOrderId: { type: Schema.Types.ObjectId, ref: "BuyOrder", required: true },
  sellOrderId: { type: Schema.Types.ObjectId, ref: "SellOrder", required: false }, 
  feePercentage: { type: Number, required: true },  // e.g. 0.5 for 0.5%
  fixedFee: { type: Number, default: 0 }, 
  currency: { type: String, required: true, default: "USDT" }, // fee currency
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
});

export const TransactionFee = mongoose.model("TransactionFee", transactionFeeSchema);
