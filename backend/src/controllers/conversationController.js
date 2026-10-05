import { convoRepo } from "../repositories/authRepo.js";
import { conversationService } from "../services/conversationService.js";

export const createConversation = async (req, res) => {
  try {
    const result = await conversationService.create(req);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const getAllConversation = async (req, res) => {
  try {
    const result = await conversationService.getAll(req.user);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};
export const getMessage = async (req, res) => {
  // /conversations/${conversationId}/message?limit=${limit}&cursor=${cursor}
  try {
    const result = await conversationService.getMess(req);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi khi gọi getMessage", error);
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const getConversationSocket = async (userId) => {
  try {
    const conversationIds = await convoRepo.findSocketID(userId);
    return conversationIds.map((item) => item._id.toString());
  } catch (error) {
    console.error("lỗi khi getConversationSocket", error);
    return [];
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const result = await conversationService.delete(req);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi khi xóa group", error);
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) console.error("lỗi hội thoại", error);
    const message = statusCode === 500 ? "Lỗi hệ thống máy chủ" : error.message;
    return res.status(statusCode).json({ message });
  }
};

export const addMembers = handle((req) => conversationService.addMembers(req));
export const removeMember = handle((req) => conversationService.removeMember(req));
export const renameGroup = handle((req) => conversationService.renameGroup(req));
export const setAdmin = handle((req) => conversationService.setAdmin(req));
export const transferOwner = handle((req) => conversationService.transferOwner(req));
export const setPersonal = handle((req) => conversationService.setPersonal(req));
export const searchMessages = handle((req) => conversationService.searchMessages(req));
export const pinMessage = handle((req) => conversationService.pinMessage(req));
