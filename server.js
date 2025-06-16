import express from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParse from "body-parser";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";
import userRouter from "./routes/userRouter.js";
// import feeRouter from "./routes/feeRouter.js";
import notificationRouter from "./routes/notificationRouter.js";
import sellOrderRouter from "./routes/sellOrderRouter.js";
import buyOrderRouter from "./routes/buyOrderRoutes.js";
import inquiryRouter from "./routes/inquiryRouter.js";
import tetherPriceRouter from "./routes/tetherPriceRouter.js";
import chatRouter from "./routes/chatRouter.js";
import cookieParser from "cookie-parser";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://tether-p2p.vercel.app",
      "http://localhost:5173",
      "https://www.tetherzone-p2p.com",
      "https://tetherzone-p2p.com",
    ], // Allow only localhost:5173
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
  },
  path: "/socket.io",
});
// auto import routes
// const { readdirSync } = require("fs");

// connect db
connectDB();
//Twilio Auth Token -- 516c74e562566c0ff9e76348ef81b409
//Twilio Account SID --

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://tether-p2p.vercel.app",
    "https://www.tetherzone-p2p.com",
    "https://tetherzone-p2p.com",
  ],
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
};

// app use
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(bodyParse.json({ limit: "10mb" }));
app.use(cookieParser());

// auto-imported routes

app.get("/", (req, res) => {
  res.send("Welcome to the backend API!");
});

app.use("/api/v1/user", userRouter);
// app.use("/api/v1/fee", feeRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/sell", sellOrderRouter);
app.use("/api/v1/tetherprice", tetherPriceRouter);
app.use("/api/v1/buy", buyOrderRouter);
app.use("/api/v1/inquiry", inquiryRouter);
app.use("/api/v1/chat", chatRouter);

let rooms = {}; // Store rooms and their participants

io.on("connection", (socket) => {
  console.log("New client connected");

  // Handle joining a room
  socket.on("joinRoom", (orderId) => {
    socket.join(orderId); // Join room based on orderId
    console.log(`Client joined room: ${orderId}`);
  });

  // Handle leaving a room
  socket.on("leaveRoom", (orderId) => {
    socket.leave(orderId);
    console.log(`Client left room: ${orderId}`);
  });

  // Handle receiving and emitting messages
  socket.on("sendMessage", (message) => {
    const { orderId } = message;
    io.to(orderId).emit("message", message); // Broadcast message to the specific room
    console.log(`Message sent to room ${orderId}: ${message.content}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3000;
// app.listen(PORT, () =>
//   console.log(`Server is running on port: ${PORT}  🎉🎉🎉`)
// );

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT} 🎉🎉🎉`);
});
