import { messageService } from "../services/messageService.js";

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) console.error("lỗi tin nhắn", error);
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const editMess = handle((req) => messageService.edit(req));
export const recallMess = handle((req) => messageService.recall(req));
export const reactMess = handle((req) => messageService.react(req));

export const sendDirectMess = async (req, res) => {
  try {
    const result = await messageService.sendDirect(req);

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
    const result = await messageService.sendGroup(req);

    return res.status(200).json(result);
  } catch (error) {
    console.error("lỗi khi gửi tin nhắn chung", error);
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};
