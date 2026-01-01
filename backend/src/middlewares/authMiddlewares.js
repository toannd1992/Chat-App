import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const protectedRouter = (req, res, next) => {
  try {
    // lấy accessToken từ header

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    // xác thực access token từ jwt
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // trả user id về trong req.user
    req.user = {
      _id: decoded.userId,
    };

    next();
  } catch (error) {
    console.error("lỗi khi xác thực Middlewares", error);
    return res.status(500).json({ message: " lỗi hệ thống Unauthorized" });
  }
};
