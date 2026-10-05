import mongoose from "mongoose";
import { io, emitToRoom } from "../socket/index.js";
import { convoRepo, messRepo } from "../repositories/authRepo.js";
import AppError from "../libs/appError.js";
import { uploadAttachments } from "../libs/upload.js";
import { emitMessage } from "../helpers/messageHelper.js";

// body.attachments là danh sách mới; imgUrl (một ảnh base64) là kiểu cũ vẫn được hỗ trợ
const normalizeAttachments = (body) => {
  if (Array.isArray(body.attachments)) return body.attachments;
  if (typeof body.imgUrl === "string" && body.imgUrl) {
    return [{ dataUrl: body.imgUrl }];
  }
  return [];
};

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
const MAX_CONTENT = 5000;

// chỉ cho reply tin nhắn thuộc cùng hội thoại
const resolveReplyTo = async (replyTo, conversationId) => {
  if (!replyTo || !mongoose.Types.ObjectId.isValid(replyTo)) return null;
  const target = await messRepo.findById(replyTo);
  if (!target || target.conversationId.toString() !== conversationId.toString()) {
    return null;
  }
  return target._id;
};

// lấy tin nhắn và kiểm tra người dùng có trong hội thoại không
const getMessageForMember = async (messageId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new AppError(400, "ID tin nhắn không hợp lệ");
  }
  const message = await messRepo.findById(messageId);
  if (!message) throw new AppError(404, "Không tìm thấy tin nhắn");

  const conversation = await convoRepo.findId(message.conversationId);
  const isMember = conversation?.participants.some(
    (p) => p.userId.toString() === userId.toString()
  );
  if (!isMember) throw new AppError(403, "Bạn không có quyền với tin nhắn này");
  return message;
};

// phát bản cập nhật của tin nhắn cho mọi người trong hội thoại
const broadcastUpdate = async (message, lastMessageContent) => {
  const populated = await messRepo.populateMessage(message);
  const conversation = await convoRepo.updateLastMessageContent({
    conversationId: message.conversationId,
    messageId: message._id,
    content: lastMessageContent,
  });
  emitToRoom(message.conversationId, "message-updated", {
    message: populated,
    lastMessage: conversation?.lastMessage ?? null,
  });

  // tin đang được ghim: thu hồi thì bỏ ghim, sửa thì cập nhật nội dung ghim
  const convo = await convoRepo.findId(message.conversationId);
  const isPinned = convo?.pinnedMessages?.some(
    (id) => id.toString() === message._id.toString()
  );
  if (isPinned) {
    if (message.deletedAt) {
      await convoRepo.update(convo._id, { $pull: { pinnedMessages: message._id } });
    }
    emitToRoom(convo._id, "conversation-updated", {
      conversation: await convoRepo.findPopulated(convo._id),
    });
  }
  return populated;
};

export const messageService = {
  edit: async ({ params, body, user }) => {
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) throw new AppError(400, "Nội dung không được để trống");
    if (content.length > MAX_CONTENT) {
      throw new AppError(400, "Tin nhắn quá dài");
    }
    const message = await getMessageForMember(params.messageId, user._id);
    if (message.senderId.toString() !== user._id.toString()) {
      throw new AppError(403, "Chỉ người gửi mới được sửa tin nhắn");
    }
    if (message.deletedAt) {
      throw new AppError(400, "Tin nhắn đã được thu hồi");
    }
    message.content = content;
    message.editedAt = new Date();
    await message.save();
    return { message: await broadcastUpdate(message, content) };
  },

  recall: async ({ params, user }) => {
    const message = await getMessageForMember(params.messageId, user._id);
    if (message.senderId.toString() !== user._id.toString()) {
      throw new AppError(403, "Chỉ người gửi mới được thu hồi tin nhắn");
    }
    if (!message.deletedAt) {
      message.content = "";
      message.imgUrl = null;
      message.attachments = [];
      message.reactions = [];
      message.editedAt = null;
      message.deletedAt = new Date();
      await message.save();
    }
    return {
      message: await broadcastUpdate(message, "Tin nhắn đã được thu hồi"),
    };
  },

  react: async ({ params, body, user }) => {
    const { emoji } = body;
    if (!REACTIONS.includes(emoji)) {
      throw new AppError(400, "Cảm xúc không hợp lệ");
    }
    const message = await getMessageForMember(params.messageId, user._id);
    if (message.deletedAt) {
      throw new AppError(400, "Tin nhắn đã được thu hồi");
    }
    const userId = user._id.toString();
    const current = message.reactions.find((r) => r.userId.toString() === userId);
    // bấm lại cùng cảm xúc thì bỏ, khác thì đổi
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId
    );
    if (!current || current.emoji !== emoji) {
      message.reactions.push({ userId: user._id, emoji });
    }
    await message.save();
    const populated = await messRepo.populateMessage(message);
    emitToRoom(message.conversationId, "message-updated", {
      message: populated,
      lastMessage: null,
    });
    return { message: populated };
  },

  sendDirect: async ({ body, user }) => {
    const { recipientId, conversationId, content, replyTo } = body;
    const rawAttachments = normalizeAttachments(body);
    const senderId = user._id;

    let conversation;
    // nếu k có nội dung và tệp đính kèm
    if (!content && rawAttachments.length === 0) {
      throw new AppError(400, "Nội dung và tệp đính kèm không thể để trống");
    }
    if (content && content.length > MAX_CONTENT) {
      throw new AppError(400, "Tin nhắn quá dài");
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

    // đã kiểm tra quyền xong mới upload
    const attachments = await uploadAttachments(rawAttachments);

    const message = await messRepo.create({
      conversationId: conversation._id,
      senderId: senderId,
      content,
      attachments,
      replyTo: await resolveReplyTo(replyTo, conversation._id),
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
    const { content, replyTo } = body;
    const rawAttachments = normalizeAttachments(body);

    const senderId = user._id; //req.user._id;
    // được lưu lại vào trong req từ middleware

    if (!content && rawAttachments.length === 0) {
      throw new AppError(400, "Nội dung và tệp đính kèm không thể để trống");
    }
    if (content && content.length > MAX_CONTENT) {
      throw new AppError(400, "Tin nhắn quá dài");
    }
    const attachments = await uploadAttachments(rawAttachments);
    const message = await messRepo.create({
      conversationId: conversation._id,
      senderId: senderId,
      content,
      attachments,
      replyTo: await resolveReplyTo(replyTo, conversation._id),
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
