import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
// import crypto from "crypto";
import { pointsModel } from "./models/pointsModel.js";
import { userModel } from "./models/userModel.js";

dotenv.config();

// MongoDB Atlas connection string
const uri = process.env.DATABASE;
// Sample documents to insert into MongoDB

// Function to insert documents into MongoDB
// async function insertDocuments() {
//   const client = new MongoClient(uri); // Create a new MongoClient instance

//   try {
//     // Connect to the MongoDB Atlas cluster
//     await client.connect();
//     console.log(" connecting...............................");

//     // Specify the database and collection
//     const database = client.db("test"); // Replace with your database name
//     const collection = database.collection("users"); // Replace with your collection name
//     console.log("🚀 ~ insertDocuments ~ collection:", collection);

//     // Insert documents into the collection
//     const result = await collection.insertMany(documents);

//     console.log(
//       `${result.insertedCount} documents were inserted into the collection.`
//     );
//   } catch (error) {
//     console.error("Error inserting documents:", error);
//   } finally {
//     // Close the connection to MongoDB
//     await client.close();
//   }
// }

// // Call the insertDocuments function
// insertDocuments().catch(console.error);










// Generate 25 manager documents dynamicall



  // adjust path to your points model


dotenv.config();

async function insertManagers() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("✅ Connected to MongoDB via Mongoose");

    const phone = "010521351313";

    for (let i = 1; i <= 25; i++) {
      const num = String(i).padStart(2, "0");
      const email = `manager${num}@gmail.com`;

      // Check if user already exists
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        console.log(`⚠️ Skipping existing user: ${email}`);
        continue;
      }

      const plainPassword = `manager${num}dq`;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Create the user (schema pre-save hook will auto-generate referralCode)
      const newUser = new userModel({
        email,
        password: hashedPassword,
        name: `manager${num}`,
        phone,
        img: "https://example.com/default-profile.png",
        telegramId: `@manager${num}`,
        isVerified: true,
        admin: false,
        manager: true,
      });

      await newUser.save();

      // Create the linked Points document
      const pointsDoc = await pointsModel.create({
        userId: newUser._id,
        points: 300,
        totalPoints: 0,
        lastClaimed: new Date(),
      });

      // Link back to user
      newUser.points = pointsDoc._id;
      await newUser.save();

      console.log(`✅ Created manager ${num}: ${email}`);
    }

    console.log("🎯 All manager accounts created successfully.");
  } catch (error) {
    console.error("❌ Error inserting managers:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

insertManagers();


