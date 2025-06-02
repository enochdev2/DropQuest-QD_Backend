import mongoose from "mongoose";
const Schema = mongoose.Schema;

const matchSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      // on a SellOrder this points to a BuyOrder, and vice-versa
      refPath: "matchModel",
    },
    matchModel: {
      type: String,
      required: true,
      enum: ["BuyOrder", "SellOrder"],
    },
    amount: {
      type: Number,
      required: true,
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const buyOrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyerNickname: {
      type: String,
    },
    buyerPhone: {
      type: String,
    },
    amount: { type: Number, required: true },
    amountRemaining: { type: Number, required: true },
    price: { type: Number }, // optional - if you want to include price
    fee: { type: Number }, // optional - if you want to include price
    status: {
      type: String,
      enum: [
        "Pending Approval",
        "Waiting for Buy",
        "Partially Matched",
        "Buy Completed",
      ],
      default: "Pending Approval",
    },
    matchedSellOrders: [matchSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

buyOrderSchema.pre("save", async function (next) {
  if ((!this.buyerNickname || !this.buyerPhone) && this.userId) {
    try {
      const User = mongoose.model("User");
      const user = await User.findById(this.userId).select("nickname phone");
      if (user) {
        this.buyerNickname = user.nickname;
        this.buyerPhone = user.phone;
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});


export const BuyOrder = mongoose.model("BuyOrder", buyOrderSchema);
