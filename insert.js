import { createUserProfileBatch } from "./controllers/userController.js";

// Manager data: emails, passwords, and derived fields
const managersData = [
  { num: 13, email: 'manager13@gmail.com', password: 'Bb19910103@', name: 'Manager 13', phone: '111-111-1111', telegramId: '@manager13' },
  { num: 14, email: 'manager14@gmail.com', password: 'asdf916310', name: 'Manager 14', phone: '111-111-1111', telegramId: '@manager14' },
  { num: 15, email: 'manager15@gmail.com', password: 'tkdgus0567', name: 'Manager 15', phone: '111-111-1111', telegramId: '@manager15' },
  { num: 16, email: 'manager16@gmail.com', password: '123456789Aa@', name: 'Manager 16', phone: '111-111-1111', telegramId: '@manager16' },
  { num: 17, email: 'manager17@gmail.com', password: 'manager17dq', name: 'Manager 17', phone: '111-111-1111', telegramId: '@manager17' },
  { num: 18, email: 'manager18@gmail.com', password: 'manager18dq', name: 'Manager 18', phone: '111-111-1111', telegramId: '@manager18' },
  { num: 19, email: 'manager19@gmail.com', password: 'manager19dq', name: 'Manager 19', phone: '111-111-1111', telegramId: '@manager19' },
  { num: 20, email: 'manager20@gmail.com', password: 'manager20dq', name: 'Manager 20', phone: '111-111-1111', telegramId: '@manager20' },
  { num: 21, email: 'manager21@gmail.com', password: 'manager21dq', name: 'Manager 21', phone: '111-111-1111', telegramId: '@manager21' },
  { num: 22, email: 'manager22@gmail.com', password: 'manager22dq', name: 'Manager 22', phone: '111-111-1111', telegramId: '@manager22' },
  { num: 23, email: 'manager23@gmail.com', password: 'manager23dq', name: 'Manager 23', phone: '111-111-1111', telegramId: '@manager23' },
  { num: 24, email: 'manager24@gmail.com', password: 'manager24dq', name: 'Manager 24', phone: '111-111-1111', telegramId: '@manager24' },
  { num: 25, email: 'manager25@gmail.com', password: 'manager25dq', name: 'Manager 25', phone: '111-111-1111', telegramId: '@manager25' },
];



// Default values for missing fields
const defaultImage = 'https://res.cloudinary.com/dg9ikhw52/image/upload/v1761046832/tether-ids/vavjyqxt2di7ialv3ccb.png'; // Update with real default image URL

// Batch create
const batchCreate = async () => {
  console.log('Starting batch creation of managers...');
  const createdUsers = [];

  for (const data of managersData) {
    try {
      const userData = {
        ...data,
        referralCode: null, // No referral code provided
        referralEmail: "",
        image: defaultImage,
      };
      const newUser = await createUserProfileBatch(userData);
      console.log("🚀 ~ batchCreate ~ newUser:", newUser)
      if (newUser) {
        createdUsers.push(newUser);
      }
    } catch (error) {
      console.error(`Error creating ${data.email}:`, error.message);
    }
  }

  console.log(`Batch complete. Created ${createdUsers.length} new users.`);
};

// Run the batch
batchCreate().catch(console.error);