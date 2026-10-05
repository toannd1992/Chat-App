import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import validator from "validator";
import { authRepo, sesstionRepo } from "../repositories/authRepo.js";
import AppError from "../libs/appError.js";

export const ACCESS_TOKEN_TTL = "30m"; // thời gian sống của accessToken
export const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // refreshToken sống 14 ngày

export const authService = {
  register: async ({ fistname, lastname, email, password }) => {
    if (!password || !email || !fistname || !lastname) {
      throw new AppError(
        400,
        "Không thể thiếu email, password, fistName, lastName"
      );
    }
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !validator.isEmail(email)
    ) {
      throw new AppError(400, "Email không hợp lệ");
    }
    if (password.length < 6 || password.length > 72) {
      throw new AppError(400, "Mật khẩu phải từ 6 đến 72 ký tự");
    }
    if (
      String(fistname).trim().length > 50 ||
      String(lastname).trim().length > 50
    ) {
      throw new AppError(400, "Họ tên quá dài");
    }

    // check email
    const checkEmail = await authRepo.findEmail({ email });

    if (checkEmail) {
      throw new AppError(409, "Email đã tồn tại");
    }

    // mã hóa password
    const hashedPassword = await bcrypt.hash(password, 10);

    // lưu DB
    const newUser = await authRepo.createUser({
      email,
      hashedPassword,
      displayName: `${fistname} ${lastname}`,
    });

    // return

    return {
      message: "Tạo tài khoản thành công",
      newUser: { email: newUser.email, displayName: newUser.displayName },
    };
  },
  login: async ({ email, password }) => {
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      throw new AppError(400, "Thiếu email hoặc password");
    }
    // tim username

    const user = await authRepo.findEmail({ email });

    // dùng chung một thông báo để không lộ email nào đã tồn tại
    if (!user) {
      throw new AppError(401, "Email hoặc mật khẩu không đúng");
    }

    // so sánh password
    const checkpass = await bcrypt.compare(password, user.hashedPassword);

    if (!checkpass) {
      throw new AppError(401, "Email hoặc mật khẩu không đúng");
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
    await sesstionRepo.createSesstion({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    return {
      accessToken,
      refreshToken,
      message: "Đăng nhập thành công",
    };
  },

  logout: async ({ refreshToken }) => {
    // đăng xuất khi không còn cookie vẫn coi là thành công
    if (!refreshToken) return { sesstion: null };
    const sesstion = await sesstionRepo.deleteSesstion({ refreshToken });
    return { sesstion };
  },
  refresh: async ({ refreshToken }) => {
    if (!refreshToken) {
      throw new AppError(400, "Nhập refreshToken");
    }
    const token = await sesstionRepo.findOneSesstion({ refreshToken });
    if (!token) {
      throw new AppError(404, "refreshToken không hợp lệ");
    }
    // kiểm tra refresh token hết hạn chưa
    if (token.expiresAt < new Date()) {
      throw new AppError(401, "token đã hết hạn");
    }

    // tạo access token mới
    const accessToken = jwt.sign(
      { userId: token.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );
    return { accessToken };
  },
};
