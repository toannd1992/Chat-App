import { convoRepo, messRepo } from "../repositories/authRepo.js";
import AppError from "../libs/appError.js";
import { emitToRoom, emitToUser, joinUsersToRoom, removeUsersFromRoom } from "../socket/index.js";

export const conversationService = {
  create: async ({ body, user }) => {
    const { type, name, memberIds } = body;
    const userId = user._id;
    // kiểm tra đầu vào
    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      memberIds.length === 0 ||
      !Array.isArray(memberIds)
    ) {
      throw new AppError(400, "Tên nhóm và thành viên là bắt buộc");
    }
    // bỏ id trùng và id của chính mình
    const cleanMemberIds = [
      ...new Set(memberIds.map((id) => id.toString())),
    ].filter((id) => id !== userId.toString());
    if (cleanMemberIds.length === 0) {
      throw new AppError(400, "Danh sách thành viên không hợp lệ");
    }
    if (type === "group" && String(name).trim().length > 100) {
      throw new AppError(400, "Tên nhóm quá dài");
    }

    let conversation;
    // nếu type là direct thì  kiểm tra

    if (type === "direct") {
      const participantId = cleanMemberIds[0];
      // tim trong db comversationModel
      conversation = await convoRepo.findDirectConvo({
        userA: userId,
        userB: participantId,
      });
      // nếu không thấy thì tạo convesation mới
      if (!conversation) {
        conversation = await convoRepo.createDirectConvo({
          userA: userId,
          userB: participantId,
        });
      }
    }
    // nếu type là group thì tạo nhóm luôn k cần kiểm tra

    if (type === "group") {
      conversation = await convoRepo.createGroupConvo({
        name,
        userId,
        memberIds: cleanMemberIds,
      });
    }

    if (!conversation) {
      throw new AppError(400, "type không hợp lệ");
    }

    // cho các thành viên vào room và báo cho những người khác (mọi tab)
    const memberIdList = conversation.participants.map((p) =>
      (p.userId?._id ?? p.userId).toString()
    );
    joinUsersToRoom(memberIdList, conversation._id);
    memberIdList
      .filter((id) => id !== userId.toString())
      .forEach((id) => emitToUser(id, "new-group", { conversation }));

    return { conversation };
  },
  getAll: async ({ _id }) => {
    const conversations = await convoRepo.findAllConvo({ _id });

    const newConversation = conversations.map((item) => {
      const parcitipant = (item.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        joinedAt: p.joinedAt,
      }));

      return {
        ...item.toObject(),
        unreadCounts: item.unreadCounts || {},
        parcitipant,
      };
    });

    return { conversations, newConversation };
  },
  getMess: async ({ params, query, user }) => {
    const { conversationId } = params;
    const { cursor } = query;
    // giới hạn số tin mỗi lần lấy
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);

    // chỉ thành viên của hội thoại mới được đọc tin nhắn
    const conversation = await convoRepo.findId(conversationId);
    if (!conversation) {
      throw new AppError(404, "Không tìm thấy cuộc hội thoại");
    }
    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === user._id.toString()
    );
    if (!isMember) {
      throw new AppError(403, "Bạn không có quyền xem hội thoại này");
    }

    let message = await messRepo.findMessage({ conversationId, limit, cursor });

    let nextCursor = null;

    if (message.length > limit) {
      message.pop(); // bỏ tin thừa dùng để biết còn trang sau
      // cursor là tin cũ nhất của trang này, trang sau lấy các tin cũ hơn nó
      nextCursor = message[message.length - 1].createdAt.toISOString();
    }

    message = message.reverse();

    return { message, nextCursor };
  },
  delete: async ({ body, params, user }) => {
    const { conversationId } = params;
    const { type } = body;
    const userId = user._id;
    // tìm cuộc hội thoại
    const conversation = await convoRepo.findId(conversationId);

    if (!conversation) {
      throw new AppError(404, "Không tìm thấy cuộc hội thoại");
    }
    switch (type) {
      case "delete_convo":
        if (conversation.type !== "direct") {
          throw new AppError(400, "Chỉ được xóa hội thoại");
        }

        const isMe = conversation.participants.some(
          (p) => p.userId.toString() === userId.toString()
        );
        if (!isMe) {
          throw new AppError(403, "Bạn không có quyền xóa hội thoại này");
        }
        // xóa tin nhắn và cuộc hội thoại
        await Promise.all([
          convoRepo.deleteConvo({ conversationId }),
          messRepo.delete({ conversationId }),
        ]);
        emitToRoom(conversationId, "remove-conversation", { conversation }, userId);
        removeUsersFromRoom(
          conversation.participants.map((p) => p.userId),
          conversationId
        );
        return {
          message: "xóa hội thoại thành công",
          conversation,
          type,
        };
      case "delete_group":
        if (conversation.type !== "group") {
          throw new AppError(400, "Không phải hội thoại nhóm");
        }
        if (conversation.group.createdBy.toString() !== userId.toString()) {
          throw new AppError(400, "Chủ phòng mới có thể xóa phòng");
        }
        // xóa tin nhắn và cuộc hội thoại
        await Promise.all([
          convoRepo.deleteConvo({ conversationId }),
          messRepo.delete({ conversationId }),
        ]);
        emitToRoom(conversationId, "remove-conversation", { conversation }, userId);
        removeUsersFromRoom(
          conversation.participants.map((p) => p.userId),
          conversationId
        );
        return {
          message: "Giải tán nhóm thành công",
          conversation,
          type,
        };
      case "leave_group":
        if (conversation.type !== "group") {
          throw new AppError(400, "Chỉ áp dụng cho nhóm");
        }
        const isUser = conversation.participants.some(
          (p) => p.userId.toString() === userId.toString()
        );

        if (!isUser) {
          throw new AppError(
            404,
            "Chỉ thành viên trong nhóm mới được rời nhóm"
          );
        }

        if (conversation.group.createdBy.toString() === userId.toString()) {
          throw new AppError(400, "Chủ nhóm không thể rời nhóm");
        }
        const updatedConversation = await convoRepo.leaveGroup({
          conversationId: conversation._id,
          userId,
        });

        // người rời nhóm thoát room, những người còn lại nhận bản cập nhật
        removeUsersFromRoom([userId], conversationId);
        emitToRoom(conversationId, "member-leave", {
          conversation: updatedConversation,
        });
        return {
          message: "Rời nhóm thành công",
          conversation: updatedConversation,
          type,
        };
      default:
        return {
          message: "Type không hợp lệ",
        };
    }
  },
};
