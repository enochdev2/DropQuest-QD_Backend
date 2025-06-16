import express from "express";
import {
  getTetherPrice,
  updateTetherPrice,
} from "../controllers/tetherPriceController.js";
import { authenticate, authorizeAdmin } from "../middleware/autheticate.js";

const router = express.Router();

// POST request to update tether price
router.post(
  "/update-tether-price",
  authenticate,
  authorizeAdmin,
  updateTetherPrice
);
router.get("/get-tether-price", getTetherPrice);

export default router;
