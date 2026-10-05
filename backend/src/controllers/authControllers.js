import { authService } from "../services/authService.js";

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //THỜI GIAN HẾT HẠN 14 NGÀY

export const signupController = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const signinController = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    // gửi refreshToken qua cookie

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true, // cookie k thể truy cập bởi js
      secure: true, // đảm bảo đc gửi qua https
      sameSite: "none", // cho phép backend, frontend chạy trên 2 domain khác nhau
      maxAge: REFRESH_TOKEN_TTL,
    });
    return res.status(200).json({
      message: result.message,
      accessToken: result.accessToken,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const signoutController = async (req, res) => {
  try {
    const result = await authService.logout(req.cookies);

    if (result) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
    }

    return res.sendStatus(204);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

// tạo accessToken mới từ refresh lại trang

export const refreshController = async (req, res) => {
  try {
    const result = await authService.refresh(req.cookies);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};
