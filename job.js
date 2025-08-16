import cron from "node-cron";
import { pointsModel } from "./models/pointsModel.js";

// Set points to the default value every day at midnight
// cron.schedule("0 0 * * *", async () => {
//   try {
//     const now = new Date();
//     const midnight = new Date(now);
//     midnight.setHours(0, 0, 0, 0); // Set to midnight today

//     await pointsModel.updateMany({}, { points: 10 });  // Refill all users' points at midnight
//     console.log("Points have been refilled for all users at midnight.");
//   } catch (error) {
//     console.error("Error refilling points:", error);
//   }
// });

export const startCronJobs = () => {
  // Run every day at midnight
  cron.schedule("0 0 * * *", async () => {
  // cron.schedule("* * * * *", async () => {
    try {
      await pointsModel.updateMany({}, { points: 100 });
      console.log("✅ Points have been refilled for all users at midnight.");
    } catch (error) {
      console.error("❌ Error refilling points:", error);
    }
  });
};
