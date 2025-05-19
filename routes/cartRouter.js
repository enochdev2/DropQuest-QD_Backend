import express, { Router } from "express";
import {
  addNFTToCart,
  getUserCart,
  removeNFTFromCart,
  clearUserCart
} from "../controllers/cartController.js";

const router = express.Router();

// Add an NFT to cart
router.post("/cart", addNFTToCart);

// Get all NFTs in a user's cart
router.get("/cart/:walletAddress", getUserCart);

// Remove a single NFT from a user's cart
router.delete("/cart/:walletAddress/:nftId/:contractAddress", removeNFTFromCart);

// Clear the entire cart for a user
router.delete("/cart/:walletAddress", clearUserCart);

export default router;
