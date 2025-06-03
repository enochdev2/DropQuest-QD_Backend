import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
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
    const { nickname, password } = req.body;
    const username = nickname;

    // Validate that both username and password are provided
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
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
    });
    console.log("🚀 ~ createUserProfile ~ newUser:", newUser);

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

    // Respond with the newly created user profile
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login user (with JWT token generation)
export const loginUser = async (req, res) => {
  try {
    const { nickname, password } = req.body;
    const username = nickname;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    // Find the user by username
    const user = await getUserByNickname(username);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
    res.status(200).json(user);
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
    console.log("🚀 ~ updateUserProfile ~ user:", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
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
