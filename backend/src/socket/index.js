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
  userOnline.set(user._id.toString(), socket.id); //luu

  io.emit("user-online", Array.from(userOnline.keys()));

  const conversationIds = await getConversationSocket(user._id);
  conversationIds.forEach((id) => {
    socket.join(id);
  });
  // lắng nghe sự kiên tạo group
  socket.on("create-group", ({ conversation }) => {
    socket.join(conversation._id);

    // lọc lấy id thành viên trong nhóm và xem có trong danh sách online k

    if (conversation.participants && conversation.participants.length > 0) {
      conversation.participants.forEach((p) => {
        const userId = p.userId._id.toString();

        // tìm trong danh sách online

        const memberId = userOnline.get(userId);

        if (memberId) {
          const memberSocket = io.sockets.sockets.get(memberId);

          if (memberSocket) {
            memberSocket.join(conversation._id);

            memberSocket.emit("new-group", { conversation });
          }
        }
      });
    }
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
  // lắng nghe sự kiên gửi kết bạn
  socket.on("friend:send-request", ({ to, request, fromUser }) => {
    // tìm xem người nhận có trong danh sách online k

    const receiverSocketId = userOnline.get(to.toString());

    // nếu onl thì gửi sự kiện
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("friend:new-request", {
        ...request,
        from: {
          _id: fromUser._id,
          displayName: fromUser.displayName,
          email: fromUser.email,
          avatarUrl: fromUser.avatarUrl,
        },
        to: to,
      });
    }
  });
  // lắng nghe sự kiên accept kết bạn
  socket.on(
    "friend:accept-request",
    ({ id, friend, requestId, conversation }) => {
      // join vào phòng
      socket.join(conversation._id);
      // tìm xem người nhận có trong danh sách online k

      const receiverSocketId = userOnline.get(id.toString());

      if (receiverSocketId) {
        // nếu onl thì gửi sự kiện báo là đã đồng ý để client thêm vào store
        io.to(receiverSocketId).emit("new-friend", {
          friend,
          requestId,
          conversation,
        });

        // lấy đối tượng socket thực tế từ io
        const socketClient = io.sockets.sockets.get(receiverSocketId);
        if (socketClient) {
          socketClient.join(conversation._id);
        }
      }
    }
  );
  // lắng nghe sự kiên decline kết bạn
  socket.on("friend:decline-request", ({ userId, requestId }) => {
    // tìm xem người nhận có trong danh sách online k

    const receiverSocketId = userOnline.get(userId.toString());

    // nếu onl thì gửi sự kiện
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("decline-friend", {
        requestId,
      });
    }
  });
  // lắng nghe sự kiên xóa kết bạn
  socket.on("friend:delete-request", ({ user, id, conversation }) => {
    // tìm xem người nhận có trong danh sách online k

    const receiverSocketId = userOnline.get(id.toString());

    // nếu onl thì gửi sự kiện
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("delete-friend", {
        user,
        conversation,
      });
    }
  });
  socket.on("disconnect", () => {
    userOnline.delete(user._id.toString()); // xoa
    io.emit("user-online", Array.from(userOnline.keys()));
    console.log(`${user.displayName} disconnect: ${socket.id}`);
  });
});

export { io, app, server };
