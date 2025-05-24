import express from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParse from "body-parser";
import connectDB from "./config/db.js";

const app = express();
// auto import routes
// const { readdirSync } = require("fs");

import userRouter from "./routes/userRouter.js";
import cartRouter from "./routes/cartRouter.js";
import notificationRouter from "./routes/notificationRouter.js";
import sellOrderRouter from "./routes/sellOrderRouter.js";
import buyOrderRouter from "./routes/buyOrderRoutes.js";
import cookieParser from "cookie-parser";

// connect db
connectDB();

const corsOptions = {
  origin:[ 'https://tether-p2p.vercel.app', "http://localhost:5173",],
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
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/sell", sellOrderRouter);
app.use("/api/v1/buy", buyOrderRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server is running on port: ${PORT}  🎉🎉🎉`)
);
