import express from "express";

// import asyncHandler from '../utils/asyncHandler';
import {
  createUserProfile,
  deleteUserProfile,
  getAllUsers,
  getUserProfile,
  loginUser,
  logoutUser,
  updateUserProfile,
  editUserImage,
  checkNicknameExists,
  getReferralList,
  getTotalUsers,
} from "../controllers/userController.js";
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });
import { authenticate, authorizeAdmin } from "../middleware/autheticate.js";
const router = express.Router();

router.post("/users", createUserProfile); // Register new user
router.get("/check-nickname/:nickname", checkNicknameExists);
router.get("/users", authenticate, authorizeAdmin, getAllUsers); // Get all users
router.get("/totalUsers", authenticate, authorizeAdmin, getTotalUsers); // Get all users
router.get("/users/:email", authenticate, getUserProfile); // Get user by nickname
router.put("/users/:nickname", authenticate, updateUserProfile); // Update user profile
router.delete("/users/:nickname", authenticate, deleteUserProfile); // Delete user profile
// PUT /api/users/:userId/image
router.get("/:referralCode", authenticate, getReferralList);
router.put('/:userId/image', upload.single('file'), editUserImage);
router.post("/login", loginUser); // Login user
router.post("/logout", logoutUser); // Logout user




export default router;
