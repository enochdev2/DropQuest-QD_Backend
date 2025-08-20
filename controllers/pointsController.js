import { pointsModel } from "../models/pointsModel.js";
import { userModel } from "../models/userModel.js";


// Function to get all users with their points
export const getAllPoints = async (req, res) => {
  try {
    const usersPoints = await pointsModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          userId: 1,
          points: 1,
          fullName: "$userDetails.fullName",
          email: "$userDetails.email",
        },
      },
    ]);
    res.status(200).json(usersPoints);
  } catch (error) {
    console.error("Error fetching points:", error);
    res.status(500).json({ error: "Failed to fetch points" });
  }
};

// Function to search for users by name or email
export const searchUserPoints = async (req, res) => {
  const { searchTerm } = req.query;
  try {
    const users = await userModel.find({
      $or: [
        { fullName: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ],
    });

    const points = await pointsModel.find({
      userId: { $in: users.map((user) => user._id) },
    });

    res.status(200).json({ users, points });
  } catch (error) {
    console.error("Error searching user points:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
};

// Function to grant/remove points for specific users
export const modifyPoints = async (req, res) => {
  const { userId, points, action } = req.body;
  if (action !== "grant" && action !== "remove") {
    return res
      .status(400)
      .json({ error: "Action must be either 'grant' or 'remove'" });
  }

  try {
    let userPoints = await pointsModel.findOne({ userId });

    if (!userPoints) {
      userPoints = new pointsModel({
        userId,
        points: 0,
        lastClaimed: new Date(),
      });
    }

    userPoints.points =
      action === "grant"
        ? userPoints.points + points
        : userPoints.points - points;

    if (userPoints.points < 0) {
      return res.status(400).json({ error: "Points cannot be negative" });
    }

    await userPoints.save();
    res.status(200).json({
      message: `Points successfully ${action}ed`,
      points: userPoints.points,
    });
  } catch (error) {
    console.error("Error modifying points:", error);
    res.status(500).json({ error: "Failed to modify points" });
  }
};

// Function to claim points (only once per day)
export const claimPoints = async (req, res) => {
  const { userId } = req.body;

  try {
    let user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    } 

    let referredBy = user.referredBy;
    if (referredBy) { 
      let referrer = await pointsModel.findOne({userId: referredBy});
      if (referrer) {
        referrer.totalPoints += 10; // Add 10 points to the referrer
        await referrer.save();
      }
    }
    let userPoints = await pointsModel.findOne({ userId });

    if (!userPoints) {
      // If the user doesn't have a record, create one
      userPoints = new pointsModel({
        userId,
        points: 100,
        totalPoints: 0,
        lastClaimed: new Date(),
      });
    }

    if (userPoints.points === 0) {
      return res
        .status(400)
        .json({ error: "You have already claimed points today." });
    }

    // If the user has points left, they can claim it
    if (userPoints.points > 0) {
      userPoints.totalPoints += userPoints.points; // Add the current points to totalPoints
      userPoints.points = 0; // Reset points to 0 after claiming

      userPoints.lastClaimed = new Date();
      userPoints.previosDayTwoClaimed = userPoints.PreviusDayOneClaimed;
      userPoints.PreviusDayOneClaimed = userPoints.CurrentDayClaimed;
      userPoints.CurrentDayClaimed = true;

      await userPoints.save();
      res.status(200).json({
        message: "Points claimed successfully",
        points: userPoints.points,
        totalPoints: userPoints.totalPoints,
      });
    } else {
      // If points are zero, throw an error because they have already claimed for the day
      return res
        .status(400)
        .json({ error: "No points available to claim today." });
    }
  } catch (error) {
    console.error("Error claiming points:", error);
    res.status(500).json({ error: "Failed to claim points" });
  }
};
export const UserPoints = async (req, res) => {
  const { userId } = req.body;

  try {
    let user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    } 

    let referredBy = user.referredBy;
    if (referredBy) { 
      let referrer = await pointsModel.findOne({userId: referredBy});
      if (referrer) {
        referrer.totalPoints += 10; // Add 10 points to the referrer
        await referrer.save();
      }
    }
    let userPoints = await pointsModel.findOne({ userId });

    if (!userPoints) {
      // If the user doesn't have a record, create one
      userPoints = new pointsModel({
        userId,
        points: 100,
        totalPoints: 0,
        lastClaimed: new Date(),
      });
    }

    if (userPoints.points === 0) {
      return res
        .status(400)
        .json({ error: "You have already claimed points today." });
    }

    // If the user has points left, they can claim it
    if (userPoints.points > 0) {
      userPoints.totalPoints += userPoints.points; // Add the current points to totalPoints
      userPoints.points = 0; // Reset points to 0 after claiming

      userPoints.lastClaimed = new Date();
      userPoints.previosDayTwoClaimed = userPoints.PreviusDayOneClaimed;
      userPoints.PreviusDayOneClaimed = userPoints.CurrentDayClaimed;
      userPoints.CurrentDayClaimed = true;

      await userPoints.save();
      res.status(200).json({
        message: "Points claimed successfully",
        points: userPoints.points,
        totalPoints: userPoints.totalPoints,
      });
    } else {
      // If points are zero, throw an error because they have already claimed for the day
      return res
        .status(400)
        .json({ error: "No points available to claim today." });
    }
  } catch (error) {
    console.error("Error claiming points:", error);
    res.status(500).json({ error: "Failed to claim points" });
  }
};
