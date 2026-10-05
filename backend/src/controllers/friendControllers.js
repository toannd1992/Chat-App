import { friendService } from "../services/friendService.js";

export const sendFriend = async (req, res) => {
  try {
    const result = await friendService.send(req);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const result = await friendService.accept(req);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    const result = await friendService.decline(req);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};
export const cancelFriendRequest = async (req, res) => {
  try {
    const result = await friendService.cancel(req);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const getAllFriends = async (req, res) => {
  try {
    const result = await friendService.getAll(req.user);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const getFriendsRequest = async (req, res) => {
  try {
    const result = await friendService.getReq(req.user);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const deleteFriend = async (req, res) => {
  try {
    const result = await friendService.delete(req);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};
