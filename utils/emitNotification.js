export const emitNotification = (io, { userId, role, message, sound = true }) => {
  const payload = { message, sound };

 if (userId) {
    console.log("🚀 ~ emitNotification ~ userId:", userId)
    console.log("Sending notification to user with userId:", userId); // Debug log
    if (userSocketMap[userId]) {
      io.to(userSocketMap[userId]).emit("notification", payload);
    } else {
      console.error(`User with ID ${userId} not found in socket map.`);
    }
  }

  // Or send to a role (e.g., all admins)
  if (role) {
    console.log("Sending notification to role:", role);
    io.to(role).emit("notification", payload);
  }
};
