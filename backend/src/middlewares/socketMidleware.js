import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const socketMidleware = async (socket, next) => {
  try {
    // lấy accessToken từ socket

    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Không tìm thấy token"));
    }
    // xác thực access token từ jwt
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        console.log(err);
        return next(new Error("Token không hợp lệ"));
      }
      // tìm user trong database
      const user = await User.findById(decoded.userId).select(
        "-hashedPassword"
      );

      if (!user) {
        return next(new Error("Người dùng không tồn tại"));
      }

      // trả user về trong req.user
      socket.user = user;

      next();
    });
  } catch (error) {
    console.error("lỗi khi xác thực socketMiddlewares", error);
    res.status(500).json({ message: " lỗi hệ thống" });
  }
};
