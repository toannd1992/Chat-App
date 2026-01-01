import { messageServies } from "../servies/authServies.js";

export const sendDirectMess = async (req, res) => {
  try {
    const result = await messageServies.sendDirect(req);

    return res.status(200).json(result);
  } catch (error) {
    console.error("lỗi khi gửi tin nhắn riêng", error);
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const sendGroupMess = async (req, res) => {
  try {
    const result = await messageServies.sendGroup(req);

    return res.status(200).json(result);
  } catch (error) {
    console.error("lỗi khi gửi tin nhắn chung", error);
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};
