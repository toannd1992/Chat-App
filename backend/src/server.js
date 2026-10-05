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
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getAllowedOrigins } from "./libs/origins.js";
import { app, server } from "./socket/index.js";

dotenv.config();

// const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5001;

// middlewares

app.use(helmet());
app.use(express.json({ limit: "10mb" })); // đọc json trên req.body (ảnh đã được nén ở client)
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser()); // lấy cookie từ req
app.use(cors({ origin: getAllowedOrigins(), credentials: true }));

// health check cho Render / cron ping
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// giới hạn số lần thử đăng nhập / đăng ký
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Thử quá nhiều lần, vui lòng quay lại sau" },
});

// public router

app.use("/api/auth", authLimiter, authRoute);

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
