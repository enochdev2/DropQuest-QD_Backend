import mongoose from "mongoose";
const Schema = mongoose.Schema;

const buyOrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },  // amount user wants to buy
  price: { type: Number }, // optional - if you want to include price
  status: {
    type: String,
    enum: ["Waiting for Buy", "Buy Completed"],
    default: "Waiting for Buy",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const BuyOrder = mongoose.model("BuyOrder", buyOrderSchema);
