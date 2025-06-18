import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import twilio from "twilio";
import {
  deleteUserByNickname,
  getUserByNickname,
  getUsers,
  updateUserByNickname,
  userModel,
} from "../models/userModel.js";
import {
  createNewAdminNotification,
  createNewUserNotification,
} from "./notificationController.js";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      nickname: user.nickname,
      admin: user.admin,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1d" }
  );
};

export const createUserProfile = async (req, res) => {
  try {
    const { nickname, password, phone,tetherIdImage } = req.body;
    console.log("🚀 ~ createUserProfile ~ tetherIdImage:", tetherIdImage)
    const username = nickname;

    // Validate that both username and password are provided
    if (!username || !password || !phone) {
      res.status(400).json({ error: "Username, password, phone are required" });
      return;
    }

    // Check if the user already exists by nickname
    const existingUser = await getUserByNickname(username);
    console.log("🚀 ~ createUserProfile ~ existingUser:", existingUser);

    if (existingUser) {
      // If the user already exists, return an error message
      res
        .status(400)
        .json({ error: "User with this nickname already exists." });
      return;
    }

    // If the user does not exist, create a new user profile
    const newUser = new userModel({
      ...req.body,
      tetherIdImage:tetherIdImage,
      isVerified: false,
    });
    console.log("🚀 ~ createUserProfile ~ newUser:", newUser);

    // Send SMS verification code using Twilio
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // You can optionally store this code in DB for later verification
    newUser.verificationCode = verificationCode;

    // await newUser.save();

    let formattedPhone;
    try {
      formattedPhone = formatKoreanPhoneNumber(phone);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    await newUser.save();

    await twilioClient.messages.create({
      body: `Your verification code is: ${verificationCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    // Create a notification for the new user registration
    const messages = `you have successfully registered: ${newUser.username}. Please wait for you account to be verified.`;
    // await createNotification(message, newUser._id);
    const message = `A new user has registered: ${newUser.username}. Please verify the account.`;
    await createNewUserNotification(
      messages,
      newUser._id,
      "registration",
      null
    );
    await createNewAdminNotification(
      message,
      newUser._id,
      "registration",
      null
    );

    console.log("🚀 ~ createUserProfile ~ newUser:", newUser);
    const { password: _, ...userData } = newUser.toObject();

    // Respond with the newly created user profile
    res.status(201).json(userData);
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.log("🚀 ~ createUserProfile ~ error.message:", error.message);
  }
};

export const verifyPhoneNumber = async (req, res) => {
  const { nickname, code } = req.body;

  try {
    const user = await getUserByNickname(nickname);
    console.log("🚀 ~ verifyPhoneNumber ~ user:", user)

    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.verificationCode === code) {
      user.isVerified = true;
      user.verificationCode = null; // Clear the code
      await user.save();
      return res
        .status(200)
        .json({ message: "Phone number verified successfully." });
    } else {
      return res.status(400).json({ error: "Invalid verification code." });
    }
  } catch (error) {
    console.log("🚀 ~ verifyPhoneNumber ~ error.message:", error.message)
    return res.status(500).json({ error: error.message });
  }
};

export const resendVerificationCode = async (req, res) => {
  const { nickname, phone } = req.body;
  console.log("🚀 ~ resendVerificationCode ~ nickname:", nickname)
  console.log("🚀 ~ resendVerificationCode ~ phone:", phone)

  try {
    // Find the user by their ID
    const user = await getUserByNickname(nickname);
    console.log("🚀 ~ resendVerificationCode ~ user:", user)

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a new verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Update the verification code in the user's profile
    user.verificationCode = verificationCode;
    await user.save();

    // Format phone number (assuming phone number is passed in raw form)
    let formattedPhone;
    try {
      formattedPhone = formatKoreanPhoneNumber(phone); // Adjust this based on your phone formatting (use Korean or other format as needed)
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // Send the verification code via Twilio
    await twilioClient.messages.create({
      body: `Your new verification code is: ${verificationCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    // Respond with a success message
    return res
      .status(200)
      .json({ message: "Verification code resent successfully." });
  } catch (error) {
    console.log("🚀 ~ resendVerificationCode ~ error.message:", error.message)
    return res.status(500).json({ error: error.message });
  }
};

// Login user (with JWT token generation)
export const loginUser = async (req, res) => {
  try {
    const { nickname, password } = req.body;
    const username = nickname;
    console.log("🚀 ~ loginUser ~ username:", username);

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    // Find the user by username
    const user = await getUserByNickname(username);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isVerified) {
      return res.status(404).json({ message: "User not Verified" });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Send the token via a secure, HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production", // Only set cookies over HTTPS in production
      secure: true,
      sameSite: "none", // This helps mitigate CSRF attacks
      maxAge: 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userData } = user.toObject(); // Destructure and remove the password field

    // Send the user data along with the JWT token
    res.status(200).json({
      message: "Login successful",
      user: userData, // Send user data without the password field
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Logout user
export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure cookie in production
    sameSite: "Strict", // SameSite to avoid CSRF
  });

  res.status(200).json({ message: "Logged out successfully" });
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single user by username (instead of wallet address)
export const getUserProfile = async (req, res) => {
  try {
    const { nickname } = req.params; // Get username from request params
    const { admin } = req.user; // Access the admin status from the decoded token
    const nick = req.user.nickname;

    if (nickname !== req.user.nickname && !admin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to update this profile" });
    }

    const user = await getUserByNickname(nickname); // Use `nickname` as search criteria
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    const { password: _, ...userData } = user.toObject();
    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user by username (instead of wallet address)
export const updateUserProfile = async (req, res) => {
  try {
    const { nickname } = req.params; // Get nickname from request params
    const { admin } = req.user; // Access the admin status from the decoded token
    const nick = req.user.nickname;

    // Check if the logged-in user is either the user themselves or an admin
    if (nickname !== req.user.nickname && !admin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to update this profile" });
    }

    // Proceed with updating the user profile
    const user = await updateUserByNickname(nickname, req.body, true);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password: _, ...userData } = user.toObject();
    res.status(200).json(userData);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const deleteUserProfile = async (req, res) => {
  try {
    const { nickname } = req.params; // Get nickname from request params
    const { userId, admin } = req.user; // Get userId and admin from the token

    // Check if the logged-in user is either the user themselves or an admin
    if (nickname !== req.user.username && !admin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this profile" });
    }

    const user = await deleteUserByNickname(nickname); // Delete user by nickname
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};








cloudinary.config({
  cloud_name: 'dg9ikhw52',
  api_key: '741795432579663',
  api_secret: 'hajeGPi0lFqi-Vg635bJJ6fTp8c'
});

const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

export const editUserImage = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Delete old image from Cloudinary (if exists)
    if (user.imagePublicId) {
      await cloudinary.uploader.destroy(user.imagePublicId);
    }

    // 2. Upload new image
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'tether-ids' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      bufferToStream(req.file.buffer).pipe(stream);
    });

    // 3. Update user with new image info
    user.tetherIdImage = uploadResult.secure_url;
    user.imagePublicId = uploadResult.public_id;
    await user.save();

    res.status(200).json({
      message: 'Image updated successfully',
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error('Edit image error:', error);
    res.status(500).json({ message: 'Failed to update image' });
  }
};






















const formatPhoneNumber = (number) => {
  let cleaned = number.replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    return `+234${cleaned.slice(1)}`; // e.g., 08012345678 -> +2348012345678
  }

  if (cleaned.startsWith("234")) {
    return `+${cleaned}`; // e.g., 2348012345678 -> +2348012345678
  }

  if (cleaned.startsWith("+234")) {
    return cleaned; // Already valid
  }

  throw new Error("Invalid Nigerian phone number format");
};

const formatKoreanPhoneNumber = (number) => {
  // Remove all non-digit characters
  let cleaned = number.replace(/\D/g, "");

  // South Korean numbers typically start with '010' (mobile), '011', etc.
  // Normalize if starts with 0 (e.g., 01012345678)
  if (cleaned.startsWith("0")) {
    return `+82${cleaned.slice(1)}`; // Strip leading 0, add +82
  }

  // If it already starts with 82 (e.g., 821012345678)
  if (cleaned.startsWith("82")) {
    return `+${cleaned}`; // Prefix +
  }

  // If it already includes the +82 prefix
  if (number.startsWith("+82")) {
    return number;
  }

  throw new Error("Invalid Korean phone number format");
};
