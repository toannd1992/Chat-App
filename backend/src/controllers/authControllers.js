import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/UserModel.js";
import Sesstion from "../models/SesstionModel.js";

const ACCESS_TOKEN_TTL = "30m"; // THỜI GIAN TỒN TẠI 15 PHÚT
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //THỜI GIAN HẾT HẠN 14 NGÀY

export const signupController = async (req, res) => {
  try {
    const { fistname, lastname, email, password } = req.body;

    if (!password || !email || !fistname || !lastname) {
      return res.status(400).json({
        message: "Không thể thiếu email, password, fistName, lastName",
      });
    }

    // check email
    const checkEmail = await User.findOne({ email });

    if (checkEmail) {
      return res.status(401).json({ message: "Email đã tồn tại" });
    }

    // mã hóa password
    const hashedPassword = await bcrypt.hash(password, 10);

    // lưu DB
    await User.create({
      email,
      hashedPassword,
      displayName: `${fistname} ${lastname}`,
    });

    // return

    return res.status(201).json({ message: "Tạo tài khoản thành công" });
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signinController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Thiếu email hoặc password" });
  }
  // tim username

  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(401)
      .json({ message: "Tài khoản hoặc mật khẩu không đúng" });
  }

  // so sánh password
  const checkpass = await bcrypt.compare(password, user.hashedPassword);

  if (!checkpass) {
    return res
      .status(401)
      .json({ message: "Tài khoản hoặc mật khẩu không đúng" });
  }

  // tạo accesToken
  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
  // tạo refresh token

  const refreshToken = crypto.randomBytes(64).toString("hex");

  // tạo sesstion để lưu refreshToken vào database

  await Sesstion.create({
    userId: user._id,
    refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
  });

  // gửi refreshToken qua cookie

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // cookie k thể truy cập bởi js
    secure: true, // đảm bảo đc gửi qua https
    sameSite: "none", // cho phép backend, frontend chạy trên 2 domain khác nhau
    maxAge: REFRESH_TOKEN_TTL,
  });
  //  trả accessToken về res
  res.status(200).json({
    accessToken: accessToken,
    message: "Đăng nhập thành công",
  });
};

export const signoutController = async (req, res) => {
  try {
    // lấy refreshToken từ cookie
    const token = req.cookies?.refreshToken; // lấy đc thì phải có cookieParser import vào server.js

    if (token) {
      // xóa refresh token trong sesstion database

      await Sesstion.deleteOne({ refreshToken: token });
      // xóa cookie

      res.clearCookie("refreshToken");
    }

    res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi đăng xuất tài khoản", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// tạo accessToken mới từ refresh lại trang

export const refreshController = async (req, res) => {
  try {
    // lấy refreshToken từ cookie
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy token" });
    }
    // so sánh refresh trong db
    const checkToken = await Sesstion.findOne({ refreshToken: token });

    if (!checkToken) {
      return res.status(403).json({ message: "token không hợp lệ" });
    }
    // kiểm tra refresh token hết hạn chưa
    if (checkToken.expiresAt < new Date()) {
      return res.status(403).json({ message: "token đã hết hạn" });
    }
    // tạo access token mới
    const accessToken = jwt.sign(
      { userId: checkToken.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );
    // return trả về res
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refresh", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
