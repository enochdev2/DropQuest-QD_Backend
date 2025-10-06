import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import crypto from "crypto";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    // Added phone number field
    phone: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: true,
    },
    telegramId: {
      type: String,
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    admin: {
      type: Boolean,
      default: false, // Assume users are not admins by default
    },
    // Referral system fields
    referralCode: {
      type: String,
      unique: true,
    },
    referredBy: {
      type: String,
      default: null,
    },
    referredByName: {
      type: String,
      default: null,
    },
    referredByEmail: {
      type: String,
      default: null,
    },
    points: { type: mongoose.Schema.Types.ObjectId, ref: "Points" },
  },
  { timestamps: true }
);

// Generate referral code before saving
userSchema.pre("save", async function (next) {
  if (!this.referralCode) {
    this.referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  }
  next();
});

// Hash password before saving the user document
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if password hasn't been modified

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password for login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // Compare hashed password
};

export const userModel = mongoose.model("User", userSchema);

// Utility functions
export const getUsers = () => userModel.find();
export const getUserByEmail = (email) => userModel.findOne({ email });
export const createUser = async (values) => {
  const user = new userModel(values);
  await user.save();
  return user.toObject();
};
export const deleteUserByEmail = (email) =>
  userModel.findOneAndDelete({ email });

export const updateUserByEmail = (email, values, newOption = true) =>
  userModel.findOneAndUpdate({ email }, values, { new: newOption });
 