import express from "express";
import {
  getAllPoints,
  searchUserPoints,
  modifyPoints,
  claimPoints,
} from "../controllers/pointsController.js";
import { authenticate, authorizeAdmin } from "../middleware/autheticate.js";

const router = express.Router();

// Route to get all users and their points
router.get("/points", getAllPoints);

// Route to search for users
router.get("/points/search", searchUserPoints);

// Route to grant/remove points for specific users
router.put("/points/modify", modifyPoints);

// Route for users to claim points (once per day)
router.post("/points/claim", authenticate,  claimPoints);

export default router;
