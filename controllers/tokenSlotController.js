import { v2 as cloudinary } from "cloudinary";
import { pointsModel } from "../models/pointsModel.js";
import { tokenModel } from "../models/tokenSlotModel.js";
import { tokenSlotModel } from "../models/tokenSlotsModel.js";

cloudinary.config({
  cloud_name: "dg9ikhw52",
  api_key: "741795432579663",
  api_secret: "hajeGPi0lFqi-Vg635bJJ6fTp8c",
});

const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

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
export const getSlots = async (req, res) => {
  try {
    const { userId } = req.params;
    // await initSlots();
    let slots;
    slots = await tokenSlotModel.find().sort({ slotId: 1 });

    res.status(200).json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
};

export const getUserSlots = async (req, res) => {
  try {
    const { id } = req.user;
    const { userId } = req.params;
    console.log("🚀 ~ getUserSlots ~ userId:", userId);
    let slots;
    slots = await tokenModel.find({ userId: id }).sort({ slotId: -1 });
    console.log("🚀 ~ getUserSlots ~ slots:", slots);

    res.status(200).json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
};
export const getAllUserSlots = async (req, res) => {
  try {
    let slots;
    slots = await tokenModel
      .find()
      .populate("userId", "name email telegramId phone") // get only needed fields
      .sort({ slotId: 1 });
    console.log("🚀 ~ getUserSlots ~ slots:", slots);

    res.status(200).json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
};

// Update one slot (e.g. BTC → GLM)
export const updateSlot = async (req, res) => {
  try {
    const { link, name, slotId, token, points, img } = req.body;
    console.log("🚀 ~ updateSlot ~ slotId:", slotId);
    console.log("🚀 ~ updateSlot ~ name:", name);

    let updatedSlot;
    if (name.toString() === "???") {
      updatedSlot = await tokenSlotModel.findOneAndUpdate(
        { _id: slotId },
        {
          $set: {
            link: " ",
            tokenName: "???",
            token: 1,
            points: 1000,
            pointRatio: "$???",
            img: "https://raw.githubusercontent.com/enochdev2/token-metadata/main/DQ%20Bitcoin%20Image.png",
          },
        },
        { new: true }
      );
    } else {
      updatedSlot = await tokenSlotModel.findOneAndUpdate(
        { _id: slotId },
        {
          $set: {
            link: link,
            tokenName: name,
            token: token,
            points: points,
            pointRatio: `$${name.toString()}`,
            img: img,
          },
        },
        { new: true }
      );
    }

    if (!updatedSlot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    res.status(200).json(updatedSlot);
  } catch (error) {
    console.error("Error updating slot:", error.message);
    res.status(500).json({ error: "Failed to update slot" });
  }
};

export const buySlot = async (req, res) => {
  try {
    const { userId, slotId, amount, tokenName, imageUrl } = req.body;
    console.log("🚀 ~ buySlot ~ imageUrl:", imageUrl)
    console.log("🚀 ~ buySlot ~ tokenName:", tokenName)
    console.log("🚀 ~ buySlot ~ amount:", amount)
    console.log("🚀 ~ buySlot ~ userId, slotId:", userId, slotId);

    // 1 GLM costs 1000 points
    // const cost = 1000;

    // Fetch user points
    let userPoints = await pointsModel.findOne({ userId });
    console.log("🚀 ~ buySlot ~ userPoints:", userPoints);
    if (!userPoints) {
      return res.status(404).json({ error: "User points record not found" });
    }

    // Check if user has enough points
    if (userPoints.totalPoints < amount) {
      return res.status(400).json({ error: "Not enough points to buy slot" });
    }
    

    const pointExchange = await tokenModel.create({
      userId: userId,
      slotId: slotId,
      tokenName: `${tokenName.toString()}`,
      pointRatio:  `$${tokenName.toString()}`,
      pointExchanged: amount,
      isConfigured: true,
      img: imageUrl,
    });
    console.log("🚀 ~ buySlot ~ pointExchange:", pointExchange);
    pointExchange.save();

    // Deduct the cost
    userPoints.totalPoints -= amount;
    await userPoints.save();

    res.status(200).json({
      message: "Slot purchased successfully",
      pointExchange,
      remainingPoints: userPoints.totalPoints,
    });
  } catch (error) {
    console.error("Error buying slot:", error);
    res.status(500).json({ error: "Failed to buy slot" });
  }
};

export const initSlots = async () => {
  try {
    // Create slots
    const initialSlots = [
      {
        slotId: 1,
        tokenName: "GLM",
        pointRatio: "$GLM",
        isConfigured: true,
        img: "https://raw.githubusercontent.com/enochdev2/token-metadata/main/Golem%20LOGO.png",
      },
      ...Array.from({ length: 24 }, (_, i) => ({
        slotId: i + 2,
        tokenName: "BTC",
        pointRatio: "$???",
        isConfigured: true,
        img: "https://raw.githubusercontent.com/enochdev2/token-metadata/main/DQ%20Bitcoin%20Image.png",
      })),
    ];

    await tokenSlotModel.insertMany(initialSlots);
    // res.status(201).json({ message: "Slots initialized successfully" });
  } catch (error) {
    console.error("Error initializing slots:", error);
    res.status(500).json({ error: "Failed to initialize slots" });
  }
};
