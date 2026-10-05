import { io } from "../socket/index.js";
import { convoRepo, messRepo } from "../repositories/authRepo.js";
import AppError from "../libs/appError.js";
import cloudinary from "../libs/cloudinary.js";
import { emitMessage } from "../helpers/messageHelper.js";

export const messageService = {
  sendDirect: async ({ body, user }) => {
    const { recipientId, conversationId, content, imgUrl: image } = body;
    const senderId = user._id;

    let conversation;
    // nếu k có conten và ảnh
    if (!content && !image) {
      throw new AppError(400, "Nội dung và ảnh không thể để trống");
    }
    // kiểm tra ảnh nếu có thì upload
    let imgUrl = null;
    // let contentImg = "";
    if (image) {
      try {
        const upload = await cloudinary.uploader.upload(image);
        imgUrl = upload.secure_url;
        // contentImg = "Hình ảnh";
      } catch (error) {
        throw new AppError(500, "Lỗi upload ảnh");
      }
    }
    // tim conversation (phải là hội thoại của chính người gửi và người nhận)
    if (conversationId) {
      conversation = await convoRepo.findId(conversationId);
      if (conversation) {
        const ids = conversation.participants.map((p) => p.userId.toString());
        const valid =
          conversation.type === "direct" &&
          ids.includes(senderId.toString()) &&
          ids.includes(recipientId.toString());
        if (!valid) {
          throw new AppError(403, "Bạn không có quyền gửi vào hội thoại này");
        }
      }
    }

    if (!conversation) {
      conversation = await convoRepo.findDirectConvo({
        userA: senderId,
        userB: recipientId,
      });
    }

    if (!conversation) {
      conversation = await convoRepo.createDirectConvo({
        userA: senderId,
        userB: recipientId,
      });
    }

    const message = await messRepo.create({
      conversationId: conversation._id,
      senderId: senderId,
      content,
      imgUrl,
    });

    // update lại conversation khi tin nhắn đc gửi

    const isSenderId = message.senderId;
    conversation = await convoRepo.updateConvo({
      conversation,
      message,
      isSenderId,
    });

    // update lại conversation khi tin nhắn đc gửi bằng socket.io
    emitMessage(io, conversation, message);
    return { message };
  },

  sendGroup: async ({ body, user, conversation }) => {
    const { conversationId, content, imgUrl: image } = body;

    const senderId = user._id; //req.user._id;
    // được lưu lại vào trong req từ middleware

    if (!content && !image) {
      throw new AppError(400, "Nội dung và ảnh không thể để trống");
    }
    // kiểm tra ảnh nếu có thì upload
    let imgUrl = null;
    // let contentImg = "";
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      imgUrl = upload.secure_url;
      // contentImg = "Hình ảnh";
    }
    const message = await messRepo.create({
      conversationId: conversation._id,
      senderId: senderId,
      content,
      imgUrl,
    });

    // update lại conversation khi tin nhắn đc gửi
    const isSenderId = message.senderId;

    conversation = await convoRepo.updateConvo({
      conversation,
      message,
      isSenderId,
    });

    emitMessage(io, conversation, message);
    return { message };
  },
};
