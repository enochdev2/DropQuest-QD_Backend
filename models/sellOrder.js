import mongoose from "mongoose";
const Schema = mongoose.Schema;

// sub-schema for matched orders
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

const sellOrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerNickname: {
      type: String,
    },
    sellerPhone: {
      type: String,
    },
    amount: { type: Number, required: true },
    amountRemaining: { type: Number, required: true },
    currency: {
      type: String,
      required: true,
      default: "USDT",
    },
    krwAmount: { type: Number, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "Pending Approval",
        "On Sale",
        "In Progress",
        "Partially Matched",
        "Sale Completed",
      ],
      default: "Pending Approval",
    },
    matchedBuyOrders: [matchSchema],

    currentBuyOrderInProgress: {
      type: Schema.Types.ObjectId,
      ref: "BuyOrder",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sellOrderSchema.pre("save", async function (next) {
  if ((!this.sellerNickname || !this.sellerPhone) && this.userId) {
    try {
      const User = mongoose.model("User");
      const user = await User.findById(this.userId).select("nickname phone");
      if (user) {
        this.sellerNickname = user.nickname;
        this.sellerPhone = user.phone;
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

export const SellOrder = mongoose.model("SellOrder", sellOrderSchema);
