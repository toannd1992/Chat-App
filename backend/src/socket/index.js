import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import { socketMidleware } from "../middlewares/socketMidleware.js";
import { getConversationSocket } from "../controllers/conversationController.js";
import ConversationModel from "../models/ConversationModel.js";
import { getAllowedOrigins } from "../libs/origins.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
});
io.use(socketMidleware);

// userId -> các socketId đang mở (một user có thể mở nhiều tab / thiết bị)
const userOnline = new Map();

const userRoom = (userId) => `user:${userId}`;

const broadcastOnline = () => {
  io.emit("user-online", Array.from(userOnline.keys()));
};

// ===== helper để service gọi: server là bên quyết định phát sự kiện =====

export const emitToUser = (userId, event, payload) => {
  io.to(userRoom(userId)).emit(event, payload);
};

export const emitToRoom = (roomId, event, payload, exceptUserId) => {
  let target = io.to(roomId.toString());
  if (exceptUserId) target = target.except(userRoom(exceptUserId));
  target.emit(event, payload);
};

// cho tất cả socket của các user vào room hội thoại
export const joinUsersToRoom = (userIds, roomId) => {
  userIds.forEach((id) => io.in(userRoom(id)).socketsJoin(roomId.toString()));
};

export const removeUsersFromRoom = (userIds, roomId) => {
  userIds.forEach((id) => io.in(userRoom(id)).socketsLeave(roomId.toString()));
};

io.on("connection", async (socket) => {
  const user = socket.user;
  const userId = user._id.toString();

  const sockets = userOnline.get(userId) ?? new Set();
  sockets.add(socket.id);
  userOnline.set(userId, sockets);

  socket.join(userRoom(userId));
  broadcastOnline();

  const conversationIds = await getConversationSocket(user._id);
  conversationIds.forEach((id) => socket.join(id));

  // trạng thái đã xem (chỉ thành viên của hội thoại mới được đánh dấu)
  socket.on("mark-as-seen", async ({ conversationId } = {}) => {
    try {
      if (!conversationId) return;
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) return;

      const isMember = conversation.participants.some(
        (p) => p.userId.toString() === userId
      );
      if (!isMember) return;

      if (!conversation.seenBy.some((id) => id.toString() === userId)) {
        conversation.seenBy.push(user._id);
      }
      if (conversation.unreadCounts) {
        conversation.unreadCounts.set(userId, 0);
      }
      await conversation.save();

      io.to(conversationId.toString()).emit("conversation-seen", {
        conversationId,
        seenBy: conversation.seenBy,
        unreadCounts: conversation.unreadCounts,
      });
    } catch (error) {
      console.error("lỗi khi mark-as-seen:", error);
    }
  });

  // đang nhập: chỉ chuyển tiếp cho người trong cùng hội thoại, không lưu DB
  socket.on("typing", ({ conversationId, isTyping } = {}) => {
    const room = String(conversationId ?? "");
    if (!room || !socket.rooms.has(room)) return;
    socket.to(room).emit("typing", {
      conversationId: room,
      userId,
      displayName: user.displayName,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on("disconnect", () => {
    const set = userOnline.get(userId);
    if (set) {
      set.delete(socket.id);
      // chỉ offline khi đã đóng hết các tab
      if (set.size === 0) userOnline.delete(userId);
    }
    broadcastOnline();
  });
});

export { io, app, server };
