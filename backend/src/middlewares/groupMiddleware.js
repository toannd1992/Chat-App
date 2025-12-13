import ConversationModel from "../models/ConversationModel.js";

export const groupMiddleware = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      return res.status(400).json({ message: "Cuộc hội thoại không tồn tại" });
    }

    const check = conversation.participants.some(
      (item) => item.userId.toString() === userId.toString()
    );

    if (!check) {
      return res
        .status(401)
        .json({ message: "Bạn không có trong danh sách nhóm" });
    }
    req.conversation = conversation;
    next();
  } catch (error) {
    console.error("Lỗi khi qua groupMiddleware", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
