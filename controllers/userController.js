import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import { Readable } from "stream";
import {
  deleteUserByEmail,
  getUserByEmail,
  getUsers,
  userModel,
} from "../models/userModel.js";
import { pointsModel } from "../models/pointsModel.js";

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      admin: user.admin,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1d" }
  );
};

export const createUserProfile = async (req, res) => {
  try {
    const { email, password, name, phone, telegramId, referralCode } = req.body;
    console.log("🚀 ~ createUserProfile ~ referralCode:", referralCode)

    if (!email || !password || !phone || !name || !telegramId) {
      res.status(400).json({
        error: "Email, password, phone, name, and telegramId are required",
      });
      return;
    }

    let referredBy

    if(referralCode){

       referredBy = await userModel.findOne({referralCode: referralCode})
    }

    const existingUser = await getUserByEmail(email);

    console.log("🚀 ~ createUserProfile ~ existingUser:", existingUser);

    if (existingUser) {
      res.status(400).json({ error: "User with this Email already exists." });
      return;
    }

    const newUser = new userModel({
      email,
      password,
      name,
      phone,
      telegramId,
      referredBy: referredBy?._id || null,
      referredByName: referredBy?.name || null,
      referredByEmail: referredBy?.email || null,
    });

    // create points for this user
    const pointsDoc = await pointsModel.create({
      userId: newUser._id,
      points: 100,
      totalPoints: 0,
      lastClaimed: new Date(),
    });

    // link to user
    newUser.points = pointsDoc._id;

    await newUser.save();

    const { password: _, ...userData } = newUser.toObject();

    // Respond with the newly created user profile
    res.status(201).json(userData);
  } catch (error) {
    // res.status(400).json({ error: error.message });
    console.log("🚀 ~ createUserProfile ~ error.message:", error.message);
  }
};

// Get all users referred by a specific code
export const getReferralList = async (req, res) => {
  const { id } = req.user;
  console.log("🚀 ~ getReferralList ~ userId:", id)
  
  const { referralCode } = req.params;

  try {
    const referredUsers = await userModel
      .find(
        { referredBy: id },
         { name: 1, email: 1, createdAt: 1, points: 1 } 
    )
    .populate("points", "totalPoints") // Populate the 'points' field with 'totalPoints' from the Points model
    .sort({ createdAt: -1 });

    res.status(200).json(referredUsers);
  } catch (error) {
    console.error("Error fetching referral list:", error);
    res.status(500).json({ error: "Failed to fetch referral list" });
  }
};

// Check if a nickname exists
export const checkNicknameExists = async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    // Convert nickname to lowercase before querying
    const existingUser = await userModel.findOne({
      nickname: { $regex: new RegExp(`^${email}$`, "i") }, // case-insensitive exact match
    });

    res.status(200).json({ exists: !!existingUser });
  } catch (error) {
    console.log("🚀 ~ checkNicknameExists ~ error:", error);
    return res.status(500).json({ error: error.message });
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

// Login user (with JWT token generation)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    // Find the user by username
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // if (!user.isVerified) {
    //   return res.status(404).json({ message: "User not Verified" });
    // }

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
    const users = await userModel.find().populate({
      path: "points",
      model: "Points",
      select: "points totalPoints lastClaimed", // exclude unwanted fields
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTotalUsers = async (req, res) => {
  try {
    // Count the number of users in the database
    const userCount = await userModel.find().countDocuments();
    const totalPoints = await pointsModel.aggregate([
      {
        $lookup: {
          from: "users", // Joining with the users collection
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $group: {
          _id: null, // No grouping by any field, just to sum all points
          totalPoints: { $sum: "$points" }, // Sum all points
        },
      },
    ]);

    // If totalPoints array is empty, return 0, otherwise, return the total points
    const total = totalPoints.length > 0 ? totalPoints[0].totalPoints : 0;

    // res.status(200).json({ totalPoints: total });

    // Return the count as the response
    res.status(200).json({ totalUsers: userCount, totalPoints: total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single user by username (instead of wallet address)
export const getUserProfile = async (req, res) => {
  try {
    const { email } = req.params; // Get username from request params
    const { admin } = req.user; // Access the admin status from the decoded token
    const nick = req.user.email;

    if (email !== req.user.email && !admin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to update this profile" });
    }

    const user = await userModel.findOne({ email }).populate({
      path: "points",
      model: "Points",
      select: "points totalPoints lastClaimed", // exclude unwanted fields
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    const { password: _, ...userData } = user.toObject();
    res.status(200).json(userData);
  } catch (error) {
    console.log("🚀 ~ getUserProfile ~ error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update user by username (instead of wallet address)
export const updateUserProfile = async (req, res) => {
  try {
    const { email } = req.params; // Get nickname from request params
    const { admin } = req.user; // Access the admin status from the decoded token
    const nick = req.user.email;

    // Check if the logged-in user is either the user themselves or an admin
    if (email !== req.user.email && !admin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to update this profile" });
    }

    // Proceed with updating the user profile
    const user = await updateUserByEmail(email, req.body, true);
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
    const { email } = req.params; // Get nickname from request params
    const { userId, admin } = req.user; // Get userId and admin from the token

    // Check if the logged-in user is either the user themselves or an admin
    if (email !== req.user.email && !admin) {
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this profile" });
    }

    const user = await deleteUserByEmail(nickname); // Delete user by nickname
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
