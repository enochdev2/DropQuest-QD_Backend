import express from "express";
import {
  getMessages,
  closeChat,
  getChatStatus,
  saveMessage,
  getOpenChats,
  adminGetMessages,
  adminGetConcludedMessages,
  getCloseChats
} from "../controllers/chatController.js";
import { authenticate } from "../middleware/autheticate.js";

const router = express.Router();

router.post("/",authenticate, saveMessage);
router.get("/messages/:orderId", getMessages);
router.get("/admin/messages/:orderId", adminGetMessages);
router.get("/admin/messages/end/:orderId", adminGetConcludedMessages);
router.patch("/close/:orderId", closeChat);
router.get("/chat/:orderId/status", getChatStatus);
router.get("/allchat", getOpenChats);
router.get("/end/allchat", getCloseChats);

export default router;
