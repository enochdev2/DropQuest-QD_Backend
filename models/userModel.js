import bcrypt from "bcryptjs";
import mongoose from "mongoose";
const Schema = mongoose.Schema;

// User schema definition
const userSchema = new Schema(
  {
    // Added username field
    username: {
      type: String,
      required: true,
      lowercase: true,
    },

    // Added nickname field
    nickname: {
      type: String,
      required: true,
      unique: true,
    },
    
    password: {
      type: String,
      required: true,
    },

    // Added full name field
    fullName: {
      type: String,
      required: true,
    },

    // Added date of birth field
    dob: {
      type: String,
      required: true,
    },

    // Added phone number field
    phone: {
      type: String,
      required: true,
    },

    // Added bank name field
    bankName: {
      type: String,
      required: true,
    },

    // Added bank account number field
    bankAccount: {
      type: Number,
      required: true,
    },

    // Added tether address field
    tetherAddress: {
      type: String,
      required: true,
      unique: true,
    },

    // Added referral code field
    referralCode: {
      type: String,
      required: true,
    },

    // Added status field, default value is 'inactive'
    status: {
      type: String,
      default: 'inactive',
    },

    // Admin field to mark if a user is an admin
    admin: {
      type: Boolean,
      default: false,  // Assume users are not admins by default
    },

  },
  { timestamps: true }
);

// Hash password before saving the user document
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Skip if password hasn't been modified

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

// Model export
export const userModel = mongoose.model("User", userSchema);

// Utility functions
export const getUsers = () => userModel.find();
export const getUserByNickname = (nickname) => userModel.findOne({ nickname });
export const createUser = async (values) => {
    const user = new userModel(values);
    await user.save();
    return user.toObject();
};
export const deleteUserByNickname = (nickname) => 
    userModel.findOneAndDelete({ nickname });

export const updateUserByNickname = (nickname, values, newOption = true) =>
    userModel.findOneAndUpdate({ nickname }, values, { new: newOption });
