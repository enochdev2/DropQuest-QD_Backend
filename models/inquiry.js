// models/Inquiry.js
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const inquirySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // the user who made inquiry
    title: { type: String, required: true },
    description: { type: String, required: true },
    comment: { type: String, default: "", select: false }, // admin only editable, hide by default
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Closed"],
      default: "Pending",
    },

    // You can add a status or other fields if needed
  },
  { timestamps: true }
);

export const Inquiry = mongoose.model("Inquiry", inquirySchema);
