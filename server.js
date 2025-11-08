import bodyParse from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import http from "http";
import morgan from "morgan";
import connectDB from "./config/db.js";
import notificationRouter from "./routes/notificationRouter.js";
import uploadRoute from "./routes/upload.js";
import userRouter from "./routes/userRouter.js";
import pointsRouter from "./routes/ponitsRouter.js";
import announcement from "./routes/announcementRouter.js";
import { startCronJobs } from "./job.js";

const app = express();
const server = http.createServer(app);

// auto import routes
// const { readdirSync } = require("fs");

// connect db
connectDB();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://www.drop-quest.",
    "https://drop-quest-qd.vercel.",
    "https://www.drop-quest/",
  ],
  credentials: true,  methods:["GET","HEAD", "PUT", "PATCH", "POST", "DELETE"],
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
app.use("/api/v1/point", pointsRouter);
app.use("/api/v1/announcement", announcement);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/upload", uploadRoute);

startCronJobs();


const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server is running on port: ${PORT}  🎉🎉🎉`)
);
 