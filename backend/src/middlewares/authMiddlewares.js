import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const protectedRouter = (req, res, next) => {
  try {
    // lấy accessToken từ header
    const header = req.headers.authorization;

    const token = header && header.split(" ")[1];

    if (!token) {
      res.status(401).json({
        message: " Không tìm thấy accessToken",
      });
    }
    // xác thực access token từ jwt
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        console.log(err);
        return res
          .status(403)
          .json({ message: " token đã hết hạn hoặc không đúng" });
      }
      // tìm user trong database
      const user = await User.findById(decoded.userId).select(
        "-hashedPassword"
      );

      if (!user) {
        return res.status(404).json({ message: "người dùng không tồn tại" });
      }

      // trả user về trong req.user
      req.user = user;

      next();
    });
  } catch (error) {
    console.error("lỗi khi xác thực Middlewares", error);
    res.status(500).json({ message: " lỗi hệ thống" });
  }
};
