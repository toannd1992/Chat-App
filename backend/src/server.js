import express from "express";
import { connectDB } from "./libs/db.js";
import dotenv from "dotenv";
import authRoute from "./routes/authRoute.js";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoute.js";
import conversationRoute from "./routes/conversationRoute.js";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoute.js";
import { protectedRouter } from "./middlewares/authMiddlewares.js";
import cors from "cors";
import { app, server } from "./socket/index.js";

dotenv.config();

// const app = express();
const PORT = process.env.PORT || 5001;

// middlewares

app.use(express.json({ limit: "50mb" })); // đọc json trên req.body
app.use(express.urlencoded({ limit: "50mb", extended: true })); // tăng giới hạn lên 50mb
app.use(cookieParser()); // lấy cookie từ req
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// public router

app.use("/api/auth", authRoute);

// private router
app.use(protectedRouter);
app.use("/api/users", userRouter);
app.use("/api/friend", friendRoute);
app.use("/api/message", messageRoute);
app.use("/api/conversation", conversationRoute);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log("Server chạy trên cổng", PORT);
  });
});
