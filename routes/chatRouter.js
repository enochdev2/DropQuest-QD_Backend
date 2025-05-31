import express from "express";
import {
  getMessages,
  closeChat,
  getChatStatus,
  saveMessage
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/", saveMessage);
router.get("/messages/:orderId", getMessages);
router.patch("/chat/:orderId/close", closeChat);
router.get("/chat/:orderId/status", getChatStatus);

export default router;
