import mongoose from "mongoose";
import { TetherPrice } from "../models/tetherPrice.js";

// Controller for changing tether price
export const updateTetherPrice = async (req, res) => {
  try {
    const userId = req.user.id; //
    console.log("🚀 ~ updateTetherPrice ~ userId:", userId);
    const { tetherPrice } = req.body; // Extract the tetherPrice and adminId from the request body

    // Validate the input data
    if (
      typeof tetherPrice !== "number" ||
      isNaN(tetherPrice) ||
      tetherPrice <= 0
    ) {
      return res.status(400).json({ message: "Invalid tether price value." });
    }

    // Create or update the tether price
    const existingPrice = await TetherPrice.findOne().sort({ createdAt: -1 }); // Get the latest entry

    let updatedPrice;
    if (existingPrice) {
      // Update the latest tether price
      updatedPrice = await TetherPrice.findByIdAndUpdate(
        existingPrice._id,
        { tetherPrice, createdBy: userId },
        { new: true } // Return the updated document
      );
    } else {
      // If no entry exists, create a new one
      updatedPrice = new TetherPrice({ tetherPrice, createdBy: userId });
      await updatedPrice.save();
    }

    return res.status(200).json({
      message: "Tether price updated successfully.",
      data: updatedPrice,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// Controller for getting the latest tether price
export const getTetherPrice = async (req, res) => {
  try {
    const latestPrice = await TetherPrice.findOne().sort({ createdAt: -1 }); // Get the latest entry based on createdAt
    console.log("🚀 ~ getTetherPrice ~ latestPrice:", latestPrice);
    console.log("🚀 ~ getTetherPrice ~ latestPrice:", latestPrice);

    if (!latestPrice) {
      return res.status(404).json({ message: "No tether price found." });
    }

    // Respond with the latest tether price
    return res.status(200).json({
      message: "Tether price fetched successfully.",
      data: latestPrice.tetherPrice,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};
