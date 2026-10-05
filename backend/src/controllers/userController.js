import { userService } from "../services/userService.js";

export const authMeController = async (req, res) => {
  try {
    const result = await userService.getMe(req.user);
    return res.status(200).json(result.user);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

// update user

export const updateAvatarController = async (req, res) => {
  try {
    const result = await userService.updateAvatar(req);

    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const updateProfileController = async (req, res) => {
  try {
    const result = await userService.updateProfile(req);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const searchUserController = async (req, res) => {
  try {
    const result = await userService.searchUser(req);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req, res);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) console.error("lỗi tài khoản", error);
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const changePasswordController = handle((req) =>
  userService.changePassword(req)
);

export const logoutAllController = handle(async (req, res) => {
  const result = await userService.logoutAll(req);
  // xóa cookie refreshToken trên thiết bị này
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  return result;
});
