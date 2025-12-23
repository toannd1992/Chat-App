import ConversationModel from "../models/ConversationModel.js";
import MessageModel from "../models/MessageModel.js";
import { emitMessage, updateConversation } from "../helpers/messageHelper.js";
import { io } from "../socket/index.js";
import cloudinary from "../libs/cloudinary.js";

export const sendDirectMess = async (req, res) => {
  try {
    const { recipientId, conversationId, content, imgUrl: image } = req.body;
    const senderId = req.user._id;

    let conversation;
    // nếu k có conten và ảnh
    if (!content && !image) {
      return res.status(400).json({
        message: "Nội dung và ảnh không thể để trống",
        content,
        image,
      });
    }
    // kiểm tra ảnh nếu có thì upload
    let imgUrl = null;
    let contentImg = "";
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      imgUrl = upload.secure_url;
      contentImg = "Hình ảnh";
    }
    // tim conversation
    if (conversationId) {
      conversation = await ConversationModel.findById(conversationId);
    }

    if (!conversation) {
      conversation = await ConversationModel.create({
        type: "direct",
        participants: [{ userId: senderId }, { userId: recipientId }],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    const message = await MessageModel.create({
      conversationId: conversation._id,
      senderId,
      content: content || contentImg,
      imgUrl,
    });
    await message.populate("senderId", "displayName avatarUrl email");
    // update lại conversation khi tin nhắn đc gửi

    const isSenderId = message.senderId;
    updateConversation(conversation, message, isSenderId);
    await conversation.save();

    // update lại conversation khi tin nhắn đc gửi bằng socket.io
    emitMessage(io, conversation, message);

    return res.status(200).json({ message });
  } catch (error) {
    console.error("lỗi khi gửi tin nhắn riêng", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};

export const sendGroupMess = async (req, res) => {
  try {
    const { conversationId, content, imgUrl: image } = req.body;

    const senderId = req.user._id; //req.user._id;
    const conversation = req.conversation; // được lưu lại vào trong req từ middleware

    if (!content && !image) {
      return res
        .status(400)
        .json({ message: "Nội dung và ảnh không thể để trống" });
    }
    // kiểm tra ảnh nếu có thì upload
    let imgUrl = null;
    let contentImg = "";
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      imgUrl = upload.secure_url;
      contentImg = "Hình ảnh";
    }
    const message = await MessageModel.create({
      conversationId,
      senderId,
      content: content || contentImg,
      imgUrl,
    });

    await message.populate("senderId", "displayName avatarUrl email");
    // update lại conversation khi tin nhắn đc gửi
    const isSenderId = message.senderId;
    updateConversation(conversation, message, isSenderId);
    // update lại conversation khi tin nhắn đc gửi bằng socket.io

    await conversation.save();

    emitMessage(io, conversation, message);
    return res.status(200).json({ message });
  } catch (error) {
    console.error("lỗi khi gửi tin nhắn chung", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};
