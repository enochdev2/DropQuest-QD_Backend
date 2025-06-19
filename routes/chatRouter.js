import express from "express";
import {
  getMessages,
  closeChat,
  getChatStatus,
  saveMessage,
  getOpenChats,
  adminGetMessages
} from "../controllers/chatController.js";
import { authenticate } from "../middleware/autheticate.js";

const router = express.Router();

router.post("/",authenticate, saveMessage);
router.get("/messages/:orderId", getMessages);
router.get("/admin/messages/:orderId", adminGetMessages);
router.patch("/close/:orderId", closeChat);
router.get("/chat/:orderId/status", getChatStatus);
router.get("/allchat", getOpenChats);

export default router;
