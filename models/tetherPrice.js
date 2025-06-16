import mongoose from "mongoose";
const { Schema } = mongoose;

const tetherPriceSchema = new Schema({
  tetherPrice: { type: Number, required: true },
  currency: { type: String, required: true, default: "USDT" }, // fee currency
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
});

export const TetherPrice = mongoose.model(
  "TetherPrice",
  tetherPriceSchema
);
