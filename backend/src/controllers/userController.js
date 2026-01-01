import { userServies } from "../servies/authServies.js";

export const authMeController = async (req, res) => {
  try {
    const result = await userServies.getMe(req.user);
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
    const result = await userServies.updateAvatar(req);

    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const updateProfileController = async (req, res) => {
  try {
    const result = await userServies.updateProfile(req);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const searchUserController = async (req, res) => {
  try {
    const result = await userServies.searchUser(req);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};
