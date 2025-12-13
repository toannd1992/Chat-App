import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketMidleware } from "../middlewares/socketMidleware.js";
import { getConversationSocket } from "../controllers/conversationController.js";
import ConversationModel from "../models/ConversationModel.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});
io.use(socketMidleware);
// lưu lại user online

const userOnline = new Map(); // userIs : socketId

io.on("connection", async (socket) => {
  const user = socket.user;
  console.log(`${user.displayName} đã kết nối: ${socket.id}`);
  userOnline.set(user._id, socket.id); //luu

  io.emit("user-online", Array.from(userOnline.keys()));

  const conversationIds = await getConversationSocket(user._id);
  conversationIds.forEach((id) => {
    socket.join(id);
  });

  // trạng thái đã xem
  socket.on("mark-as-seen", async ({ conversationId }) => {
    try {
      // tìm cuộc hội thoại trong DB
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) return;

      const userIdStr = user._id.toString();

      // thêm user hiện tại vào nếu chưa có
      if (!conversation.seenBy.includes(user._id)) {
        conversation.seenBy.push(user._id);
      }

      //reset số tin nhắn chưa đọc của user này về 0
      // Lưu ý: unreadCounts là Map trong Mongoose
      if (conversation.unreadCounts) {
        conversation.unreadCounts.set(userIdStr, 0);
      }

      // lưu
      await conversation.save();

      // gửi sự kiện ngược lại cho tất cả client trong phòng

      io.to(conversationId).emit("conversation-seen", {
        conversationId,
        seenBy: conversation.seenBy,
        unreadCounts: conversation.unreadCounts,
      });
    } catch (error) {
      console.error("lỗi khi mark-as-seen:", error);
    }
  });

  socket.on("disconnect", () => {
    userOnline.delete(user._id); // xoa
    io.emit("user-online", Array.from(userOnline.keys()));
    console.log(`${user.displayName} disconnect: ${socket.id}`);
  });
});

export { io, app, server };
