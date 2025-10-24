import mongoose from "mongoose";
const Schema = mongoose.Schema;

const pointsSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    points: {
      type: Number, 
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    lastClaimed: {
      type: Date,  // Timestamp of the last claim
      required: true,
    },
    CurrentDayClaimed: {
      type: Boolean,
      default: false, 
    },  
    PreviusDayOneClaimed: {
      type: Boolean,
      default: false, 
    },
    previosDayTwoClaimed: {
      type: Boolean,
      default: false, 
    },
  },
  { timestamps: true }
);

export const pointsModel = mongoose.model("Points", pointsSchema);
