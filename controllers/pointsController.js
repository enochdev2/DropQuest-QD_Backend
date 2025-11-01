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
  try {
    let userPoints = await pointsModel.findOne({ userId });

    if (!userPoints) {
      userPoints = new pointsModel({
        userId,
        points: points,
        lastClaimed: new Date(),
      });
    }

    res.status(200).json({
      message: `Points successfully ${action}ed`,
      points: userPoints.points,
    });
  } catch (error) {
    console.error("Error modifying points:", error);
    res.status(500).json({ error: "Failed to modify points" });
  }
};

export const modifyUserPoints = async (req, res) => {
  const { userId, points } = req.body;
  try {
    // Find or create & update points directly
    const userPoints = await pointsModel.findOneAndUpdate(
      { userId },
      {
        $inc: { totalPoints: points }, // increase numbers
        $set: { lastClaimed: new Date() }, // set date
      },
      { new: true, upsert: true } // create if not exist, return updated
    );

    res.status(200).json({
      message: "Points successfully updated",
      totalPoints: userPoints.totalPoints,
    });
  } catch (error) {
    console.error("Error modifying points:", error);
    res.status(500).json({ error: "Failed to modify points" });
  }
};

// Function to claim points (only once per day)
// export const claimPoints = async (req, res) => {
//   const { userId } = req.body;

//   try {
//     let user = await userModel.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     let referredBy = user.referredBy;
//     if (referredBy) {
//       let referrer = await pointsModel.findOne({ userId: referredBy });
//       if (referrer) {
//         referrer.totalPoints += 10; // Add 10 points to the referrer
//         await referrer.save();
//       }
//     }
//     let userPoints = await pointsModel.findOne({ userId });

//     if (!userPoints) {
//       // If the user doesn't have a record, create one
//       userPoints = new pointsModel({
//         userId,
//         points: 100,
//         totalPoints: 0,
//         lastClaimed: new Date(),
//       });
//     }

//     if (userPoints.points === 0) {
//       return res
//         .status(400)
//         .json({ error: "You have already claimed points today." });
//     }

//     // If the user has points left, they can claim it
//     if (userPoints.points > 0) {
//       userPoints.totalPoints += userPoints.points; // Add the current points to totalPoints
//       userPoints.points = 0; // Reset points to 0 after claiming

//       userPoints.lastClaimed = new Date();
//       userPoints.previosDayTwoClaimed = userPoints.PreviusDayOneClaimed;
//       userPoints.PreviusDayOneClaimed = userPoints.CurrentDayClaimed;
//       userPoints.CurrentDayClaimed = true;

//       await userPoints.save();
//       res.status(200).json({
//         message: "Points claimed successfully",
//         points: userPoints.points,
//         totalPoints: userPoints.totalPoints,
//       });
//     } else {
//       // If points are zero, throw an error because they have already claimed for the day
//       return res
//         .status(400)
//         .json({ error: "No points available to claim today." });
//     }
//   } catch (error) {
//     console.error("Error claiming points:", error);
//     res.status(500).json({ error: "Failed to claim points" });
//   }
// };

export const UserPoints = async (req, res) => {
  const { userId } = req.body;

  try {
    let user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let referredBy = user.referredBy;
    if (referredBy) {
      let referrer = await pointsModel.findOne({ userId: referredBy });
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


// Helper to check if two dates are the same day (ignores time)
// const isSameDay = (date1, date2) => {
//   return date1.toDateString() === date2.toDateString();
// };

// // Function to claim points (only once per day)
// export const claimPoints = async (req, res) => {
//   const { userId } = req.body;

//   try {
//     const user = await userModel.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const today = new Date();
//     let userPoints = await pointsModel.findOne({ userId });

//     // Check if already claimed today
//     const isAlreadyClaimed =
//       userPoints &&
//       userPoints.lastClaimed &&
//       isSameDay(userPoints.lastClaimed, today);
//     if (isAlreadyClaimed) {
//       return res
//         .status(400)
//         .json({ error: "You have already claimed points today." });
//     }

//     // Create record if new user
//     if (!userPoints) {
//       userPoints = new pointsModel({
//         userId,
//         totalPoints: 300,
//         currentStreak: 0,
//         lastClaimed: null,
//       });
//     }

//     // Calculate streak and points
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);
//     const isConsecutive =
//       userPoints.lastClaimed && isSameDay(userPoints.lastClaimed, yesterday);

//     let newStreak = 1;
//     if (isConsecutive) {
//       if (userPoints.currentStreak === 7) {
//         newStreak = 1; // Cycle back after Day 7
//       } else {
//         newStreak = userPoints.currentStreak + 1;
//       }
//     } // Else: reset to 1 on miss or first claim

//     let pointsToClaim;
//     if (newStreak <= 5) {
//       pointsToClaim = 100;
//     } else if (newStreak === 6) {
//       pointsToClaim = 200;
//     } else if (newStreak === 7) {
//       pointsToClaim = 300;
//     } else {
//       // Fallback (shouldn't happen)
//       pointsToClaim = 100;
//       newStreak = 1;
//     }

//     // Award points to user
//     userPoints.totalPoints += pointsToClaim;
//     userPoints.currentStreak = newStreak;
//     userPoints.lastClaimed = today;

//     await userPoints.save();

//     // Referral bonus (10% of claimed points)
//     const referredBy = user.referredBy;
//     if (referredBy) {
//       const referrerPoints = await pointsModel.findOne({ userId: referredBy });
//       if (referrerPoints) {
//         const bonus = Math.floor(pointsToClaim * 0.1);
//         referrerPoints.totalPoints += bonus;
//         await referrerPoints.save();
//       }
//     }

//     res.status(200).json({
//       message: "Points claimed successfully",
//       day: newStreak,
//       pointsClaimed: pointsToClaim,
//       totalPoints: userPoints.totalPoints,
//     });
//   } catch (error) {
//     console.error("Error claiming points:", error);
//     res.status(500).json({ error: "Failed to claim points" });
//   }
// };


// Helper to get YYYY-MM-DD string in KST (Asia/Seoul) for consistent day comparison
const getKSTDateString = (date) => {
  if (!(date instanceof Date) || isNaN(date)) return null;
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Seoul' 
  }).format(date); // Outputs YYYY-MM-DD
};

// Updated isSameDay to use KST strings (replaces the old local toDateString)
const isSameDayKST = (date1, date2) => {
  const date1KST = getKSTDateString(date1);
  const date2KST = getKSTDateString(date2);
  return date1KST === date2KST;
};

// Function to claim points (only once per day, KST-aware)
export const claimPoints = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const today = new Date(); // Still use this, but normalize below
    let userPoints = await pointsModel.findOne({ userId });

    // KST-aware check if already claimed today
    const lastClaimedDate = userPoints?.lastClaimed ? new Date(userPoints.lastClaimed) : null;
    const isValidLastClaimed = lastClaimedDate instanceof Date && !isNaN(lastClaimedDate);
    const isAlreadyClaimed = isValidLastClaimed && isSameDayKST(lastClaimedDate, today);
    
    if (isAlreadyClaimed) {
      return res
        .status(400)
        .json({ error: "You have already claimed points today." });
    }

    // Create record if new user
    if (!userPoints) {
      userPoints = new pointsModel({
        userId,
        totalPoints: 300,
        currentStreak: 0,
        lastClaimed: null,
      });
    }

    // KST-aware streak calculation
    const yesterdayKST = new Date(today);
    yesterdayKST.setUTCDate(yesterdayKST.getUTCDate() - 1); // Use UTC arithmetic to avoid local bias, then normalize
    const isConsecutive = isValidLastClaimed && isSameDayKST(lastClaimedDate, yesterdayKST);

    let newStreak = 1;
    if (isConsecutive) {
      if (userPoints.currentStreak === 7) {
        newStreak = 1; // Cycle back after Day 7
      } else {
        newStreak = userPoints.currentStreak + 1;
      }
    } // Else: reset to 1 on miss or first claim

    let pointsToClaim;
    if (newStreak <= 5) {
      pointsToClaim = 100;
    } else if (newStreak === 6) {
      pointsToClaim = 200;
    } else if (newStreak === 7) {
      pointsToClaim = 300;
    } else {
      // Fallback (shouldn't happen)
      pointsToClaim = 100;
      newStreak = 1;
    }

    // Award points to user (save lastClaimed as-is; comparisons handle TZ)
    userPoints.totalPoints += pointsToClaim;
    userPoints.currentStreak = newStreak;
    userPoints.lastClaimed = today; // Timestamp is UTC under the hood, but we normalize on compare

    await userPoints.save();

    // Referral bonus (10% of claimed points) - unchanged
    const referredBy = user.referredBy;
    if (referredBy) {
      const referrerPoints = await pointsModel.findOne({ userId: referredBy });
      if (referrerPoints) {
        const bonus = Math.floor(pointsToClaim * 0.1);
        referrerPoints.totalPoints += bonus;
        await referrerPoints.save();
      }
    }

    res.status(200).json({
      message: "Points claimed successfully",
      day: newStreak,
      pointsClaimed: pointsToClaim,
      totalPoints: userPoints.totalPoints,
    });
  } catch (error) {
    console.error("Error claiming points:", error);
    res.status(500).json({ error: "Failed to claim points" });
  }
};