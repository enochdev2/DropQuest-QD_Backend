import { pointsModel } from "../models/pointsModel.js";
import { tokenSlotModel } from "../models/tokenSlotModel.js";
import { tokenSlotsModel } from "../models/tokenSlotsModel.js";

// Initialize slots for a user (only once)
export const initSlot = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if slots already exist for this user
    const existing = await tokenSlotModel.find({ userId });
    if (existing.length > 0) {
      return res.status(400).json({ error: "Slots already initialized" });
    }

    // Create slots
    const initialSlots = [
      {
        userId,
        slotId: 1,
        tokenName: "GLM",
        pointRatio: "$GLM",
        isConfigured: true,
        img: "https://raw.githubusercontent.com/enochdev2/token-metadata/main/Golem%20LOGO.png",
      },
      ...Array.from({ length: 49 }, (_, i) => ({
        userId,
        slotId: i + 2,
        tokenName: "BTC",
        pointRatio: "$???",
        isConfigured: true,
        img: "https://raw.githubusercontent.com/enochdev2/token-metadata/main/DQ%20Bitcoin%20Image.png",
      })),
    ];

    await tokenSlotModel.insertMany(initialSlots);
    res.status(201).json({ message: "Slots initialized successfully" });
  } catch (error) {
    console.error("Error initializing slots:", error);
    res.status(500).json({ error: "Failed to initialize slots" });
  }
};

// Get all slots for a user
export const getUserSlots = async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("🚀 ~ getUserSlots ~ userId:", userId)
      let slots
      slots = await tokenSlotModel.find().sort({ slotId: 1 });
      if(slots.length === 0) {
        slots = initSlots();
      }
      console.log("🚀 ~ getUserSlots ~ slots:", slots)
      res.status(200).json(slots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      res.status(500).json({ error: "Failed to fetch slots" });
    }
};

// Update one slot (e.g. BTC → GLM)
export const updateSlot = async (req, res) => {
  try {
    const { userId, slotId } = req.params;
    const updateData = req.body; // { tokenName, pointRatio, img, etc. }

    const updated = await tokenSlotModel.findOneAndUpdate(
      { userId, slotId },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Slot not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating slot:", error);
    res.status(500).json({ error: "Failed to update slot" });
  }
};


export const buySlot = async (req, res) => {
  try {
    const { userId, slotId } = req.body;
    console.log("🚀 ~ buySlot ~ userId, slotId:", userId, slotId)

    // 1 GLM costs 1000 points
    const cost = 1000;

    // Fetch user points
    let userPoints = await pointsModel.findOne({ userId });
    if (!userPoints) {
      return res.status(404).json({ error: "User points record not found" });
    }

    // Check if user has enough points
    if (userPoints.totalPoints < cost) {
      return res.status(400).json({ error: "Not enough points to buy slot" });
    }

    // Deduct the cost
    userPoints.totalPoints -= cost;
    await userPoints.save();

    // Update the slot to GLM
    const updatedSlot = await tokenSlotModel.findOneAndUpdate(
      { userId, slotId },
      {
        $set: {
          tokenName: "GLM",
          pointRatio: "$GLM",
          img: "https://raw.githubusercontent.com/enochdev2/token-metadata/main/Golem%20LOGO.png",
        },
      },
      { new: true }
    );

    if (!updatedSlot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    res.status(200).json({
      message: "Slot purchased successfully",
      updatedSlot,
      remainingPoints: userPoints.totalPoints,
    });
  } catch (error) {
    console.error("Error buying slot:", error);
    res.status(500).json({ error: "Failed to buy slot" });
  }
};


export const initSlots = async (userId) => {
  try {
    // Create slots
    const initialSlots = [
      {
        userId,
        slotId: 1,
        tokenName: "GLM",
        pointRatio: "$GLM",
        isConfigured: true,
        img: "https://raw.githubusercontent.com/enochdev2/token-metadata/main/Golem%20LOGO.png",
      },
      ...Array.from({ length: 49 }, (_, i) => ({
        userId,
        slotId: i + 2,
        tokenName: "BTC",
        pointRatio: "$???",
        isConfigured: true,
        img: "https://raw.githubusercontent.com/enochdev2/token-metadata/main/DQ%20Bitcoin%20Image.png",
      })),
    ];

    await tokenSlotsModel.insertMany(initialSlots);
    res.status(201).json({ message: "Slots initialized successfully" });
  } catch (error) {
    console.error("Error initializing slots:", error);
    res.status(500).json({ error: "Failed to initialize slots" });
  }
};
