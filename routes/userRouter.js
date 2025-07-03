import express from "express";

// import asyncHandler from '../utils/asyncHandler';
import {
  createUserProfile,
  deleteUserProfile,
  getAllUsers,
  getUserProfile,
  loginUser,
  logoutUser,
  resendVerificationCode,
  updateUserProfile,
  verifyPhoneNumber,
  editUserImage,
  sendVerificationCode,
  checkNicknameExists
} from "../controllers/userController.js";
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });
import { authenticate, authorizeAdmin } from "../middleware/autheticate.js";
const router = express.Router();

router.post("/users", createUserProfile); // Register new user
router.get("/check-nickname/:nickname", checkNicknameExists);
router.get("/users", authenticate, authorizeAdmin, getAllUsers); // Get all users
router.post("/users/verify", verifyPhoneNumber);
router.post("/users/sendCode", sendVerificationCode);
router.post("/users/resendverify", resendVerificationCode);
router.get("/users/:nickname", authenticate, getUserProfile); // Get user by nickname
router.put("/users/:nickname", authenticate, updateUserProfile); // Update user profile
router.delete("/users/:nickname", authenticate, deleteUserProfile); // Delete user profile
// PUT /api/users/:userId/image
router.put('/:userId/image', upload.single('file'), editUserImage);
router.post("/login", loginUser); // Login user
router.post("/logout", logoutUser); // Logout user


// import { getUser, getAllUsers, uploadPhoto } from '../controllers/userController';
// import { authenticate, Admin } from '../middleware/authentication';
// import { upload } from '../middleware/multer';
//endpoint to verify a registered user
// router.get('/verify-user/:id/:token', asyncHandler(verify_User));

//endpoint to upload a profile photo
// router.put('/upload-pic', upload.single('userPicture'), asyncHandler(authenticate),  asyncHandler(uploadPhoto));

//endpoint to get a user profile
// router.get("/get-user", asyncHandler(authenticate), asyncHandler(getUser));

//endpoint to get all users on the platform
// router.get("/get-all", asyncHandler(authenticate), asyncHandler(getAllUsers));

//endpoint to update the user's profile
// router.put("/update-profile", asyncHandler(authenticate), asyncHandler(updateUserProfile));

//endpoint to delete user profile
// router.delete("/delete-profile/:id", asyncHandler(authenticate), asyncHandler(deleteUserProfile));

export default router;
