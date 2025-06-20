import mongoose from "mongoose";
const Schema = mongoose.Schema;

const verificationCodeSchema = new Schema(
  {
    
    phone: {
      type: String,
      required: true,
    },

    verificationCode: { type: String },

    isVerified: { type: Boolean, default: false },

  },
  { timestamps: true }
);


// Model export
export const verificationCodeModel = mongoose.model("VerifcationCode", verificationCodeSchema);
