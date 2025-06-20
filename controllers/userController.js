import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import { Readable } from "stream";
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
import { verificationCodeModel } from "../models/VerificationModel.js";

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
    const { nickname, password, phone, tetherIdImage } = req.body;
    const username = nickname;

    // Validate that both username and password are provided
    if (!username || !password || !phone) {
      res.status(400).json({ error: "Username, password, phone are required" });
      return;
    }

    // Check if the user already exists by nickname
    const existingUser = await getUserByNickname(username);

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
      tetherIdImage: tetherIdImage,
      isVerified: false,
      verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
    });

    // const verificationCode = Math.floor(
    //   100000 + Math.random() * 900000
    // ).toString();

    // newUser.verificationCode = verificationCode;

    let formattedPhone;
    try {
      formattedPhone = formatKoreanPhoneNumber(phone);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const smsResp = await sendSmsWithBoss(
      formattedPhone,
      `Your verification code is: ${newUser.verificationCode}`
    );
    console.log("SMS-Boss API response:", smsResp);

    await newUser.save();

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

// 1. Controller to send a verification code
export const sendVerificationCode = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    // Format phone number to match Korean format (if needed)
    let formattedPhone;
    try {
      formattedPhone = formatKoreanPhoneNumber(phone); // Make sure this function is implemented
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // Generate a new verification code
    const verificationCode = generateVerificationCode();

    // Create or update the verification code record
    let existingRecord = await verificationCodeModel.findOne({ phone });
    if (existingRecord) {
      existingRecord.verificationCode = verificationCode;
      existingRecord.isVerified = false; // Reset verification status
      await existingRecord.save();
    } else {
      existingRecord = new verificationCodeModel({
        phone,
        verificationCode,
        isVerified: false,
      });
      await existingRecord.save();
    }

    // Send the verification code via SMS
    const message = `Your verification code is: ${verificationCode}`;
    await sendSmsWithBoss(formattedPhone, message);

    // Respond with success
    return res
      .status(200)
      .json({ message: "Verification code sent successfully." });
  } catch (err) {
    console.error("Error sending verification code:", err);
    return res.status(500).json({ error: "Failed to send verification code." });
  }
};

// 2. Controller to verify the code entered by the user
export const verifyPhoneNumber = async (req, res) => {
  const { phone, verificationCode } = req.body;
  console.log("🚀 ~ verifyPhoneNumber ~ phone:", phone);
  console.log("🚀 ~ verifyPhoneNumber ~ verificationCode:", verificationCode);

  if (!phone || !verificationCode) {
    return res
      .status(400)
      .json({ error: "Phone number and verification code are required" });
  }

  try {
    // Find the user by phone number
    const userRecord = await verificationCodeModel.findOne({ phone });

    if (!userRecord) {
      return res.status(404).json({ error: "Phone number not found." });
    }

    // Check if the code matches
    if (userRecord.verificationCode === verificationCode) {
      // Mark the phone number as verified
      userRecord.isVerified = true;
      await userRecord.save();

      return res
        .status(200)
        .json({ message: "Phone number verified successfully." });
    } else {
      return res.status(400).json({ error: "Invalid verification code." });
    }
  } catch (err) {
    console.error("Error verifying code:", err);
    return res.status(500).json({ error: "Failed to verify the code." });
  }
};

// 3. Controller to check if the phone number is verified
export const checkVerificationStatus = async (req, res) => {
  const { phone } = req.params;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    const userRecord = await verificationCodeModel.findOne({ phone });

    if (!userRecord) {
      return res.status(404).json({ error: "Phone number not found." });
    }

    return res.status(200).json({ isVerified: userRecord.isVerified });
  } catch (err) {
    console.error("Error checking verification status:", err);
    return res
      .status(500)
      .json({ error: "Failed to check verification status." });
  }
};

export const resendVerificationCode = async (req, res) => {
  const { phone } = req.body;
  console.log("🚀 ~ resendVerificationCode ~ phone:", phone);

  try {
    // Fetch user by their nickname
    const user = await verificationCodeModel.findOne({ phone }); // Use phone to find the user (or nickname if needed)
    console.log("🚀 ~ resendVerificationCode ~ user:", user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a new verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Update the verification code in the user's record
    user.verificationCode = verificationCode;
    user.isVerified = false; // Reset verification status
    await user.save();

    // Format phone number (ensure you have a correct formatting function)
    let formattedPhone;
    try {
      formattedPhone = formatKoreanPhoneNumber(phone); // Adjust this if you need other formats
    } catch (err) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    // Send the verification code via SMS
    const message = `Your verification code is: ${verificationCode}`;
    const smsResp = await sendSmsWithBoss(formattedPhone, message);

    console.log("SMS-Boss API response:", smsResp);

    // Respond with a success message
    return res
      .status(200)
      .json({ message: "Verification code resent successfully." });
  } catch (error) {
    console.error("🚀 ~ resendVerificationCode ~ error:", error.message);
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
  cloud_name: "dg9ikhw52",
  api_key: "741795432579663",
  api_secret: "hajeGPi0lFqi-Vg635bJJ6fTp8c",
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
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Delete old image from Cloudinary (if exists)
    if (user.imagePublicId) {
      await cloudinary.uploader.destroy(user.imagePublicId);
    }

    // 2. Upload new image
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "tether-ids" },
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
      message: "Image updated successfully",
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("Edit image error:", error);
    res.status(500).json({ message: "Failed to update image" });
  }
};

// no import needed if Node 18+
export async function sendSmsWithBoss(recipient, message) {
  const url = "https://api.sms-boss.com/v2/messages"; // replace with exact endpoint
  const apiKey = process.env.SMS_BOSS_API_KEY;
  console.log("🚀 ~ sendSmsWithBoss ~ apiKey:", apiKey);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.SMS_BOSS_API_KEY,
    },
    body: JSON.stringify({
      originator: "SMSBOSS", // or replace with your sender ID
      recipients: [recipient], // MUST be an array
      body: message,
    }),
  });
  console.log("🚀 ~ sendSmsWithBoss ~ response:", response);
  const data = await response.json();

  if (!response.ok) {
    console.error("SMS Boss API Error:", data);
    throw new Error(
      `Failed to send SMS: ${data.message || response.statusText}`
    );
  }

  return data;
}

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

// Helper function to generate a random 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

// await twilioClient.messages.create({
//   body: `Your verification code is: ${verificationCode}`,
//   from: process.env.TWILIO_PHONE_NUMBER,
//   to: formattedPhone,
// });
