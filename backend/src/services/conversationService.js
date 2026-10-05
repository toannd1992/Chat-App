import mongoose from "mongoose";
import {
  authRepo,
  convoRepo,
  friendRepo,
  messRepo,
} from "../repositories/authRepo.js";
import AppError from "../libs/appError.js";
import { emitToRoom, emitToUser, joinUsersToRoom, removeUsersFromRoom } from "../socket/index.js";

const MAX_GROUP_MEMBERS = 50;
const MAX_PINNED_MESSAGES = 3;

const idOf = (value) => (value?._id ?? value).toString();

// lấy hội thoại và kiểm tra người dùng là thành viên
const getConvoForMember = async (conversationId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new AppError(400, "ID hội thoại không hợp lệ");
  }
  const conversation = await convoRepo.findId(conversationId);
  if (!conversation) throw new AppError(404, "Không tìm thấy cuộc hội thoại");
  const isMember = conversation.participants.some(
    (p) => idOf(p.userId) === userId.toString()
  );
  if (!isMember) throw new AppError(403, "Bạn không có trong hội thoại này");
  return conversation;
};

const getGroupForMember = async (conversationId, userId) => {
  const conversation = await getConvoForMember(conversationId, userId);
  if (conversation.type !== "group") {
    throw new AppError(400, "Chỉ áp dụng cho nhóm");
  }
  return conversation;
};

const isOwner = (conversation, userId) =>
  idOf(conversation.group.createdBy) === userId.toString();
const isAdmin = (conversation, userId) =>
  (conversation.group.admins ?? []).some((id) => idOf(id) === userId.toString());

// chủ nhóm hoặc phó nhóm
const assertCanManage = (conversation, userId) => {
  if (!isOwner(conversation, userId) && !isAdmin(conversation, userId)) {
    throw new AppError(403, "Chỉ chủ nhóm hoặc phó nhóm mới có quyền này");
  }
};

// báo cho mọi người trong nhóm bản cập nhật mới nhất
const broadcastConversation = async (conversationId) => {
  const populated = await convoRepo.findPopulated(conversationId);
  emitToRoom(conversationId, "conversation-updated", {
    conversation: populated,
  });
  return populated;
};

export const conversationService = {
  addMembers: async ({ params, body, user }) => {
    const conversation = await getGroupForMember(params.conversationId, user._id);
    assertCanManage(conversation, user._id);

    const ids = [...new Set((body.memberIds ?? []).map(String))];
    if (ids.length === 0 || ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      throw new AppError(400, "Danh sách thành viên không hợp lệ");
    }
    const existing = new Set(conversation.participants.map((p) => idOf(p.userId)));
    const newIds = ids.filter((id) => !existing.has(id));
    if (newIds.length === 0) {
      throw new AppError(400, "Những người này đã ở trong nhóm");
    }
    if (existing.size + newIds.length > MAX_GROUP_MEMBERS) {
      throw new AppError(400, `Nhóm tối đa ${MAX_GROUP_MEMBERS} thành viên`);
    }
    // chỉ được thêm người đã là bạn bè của mình
    for (const id of newIds) {
      const [a, b] = [user._id.toString(), id].sort();
      const [exists, friend] = await Promise.all([
        authRepo.existUser({ _id: id }),
        friendRepo.findOneFriend({ userA: a, userB: b }),
      ]);
      if (!exists || !friend) {
        throw new AppError(400, "Chỉ có thể thêm bạn bè vào nhóm");
      }
    }

    const updated = await convoRepo.update(conversation._id, {
      $push: { participants: { $each: newIds.map((id) => ({ userId: id })) } },
    });
    joinUsersToRoom(newIds, conversation._id);
    newIds.forEach((id) => emitToUser(id, "new-group", { conversation: updated }));
    await broadcastConversation(conversation._id);
    return { conversation: updated };
  },

  removeMember: async ({ params, user }) => {
    const conversation = await getGroupForMember(params.conversationId, user._id);
    assertCanManage(conversation, user._id);
    const targetId = params.userId;
    const inGroup = conversation.participants.some((p) => idOf(p.userId) === targetId);
    if (!inGroup) throw new AppError(404, "Người này không ở trong nhóm");
    if (targetId === user._id.toString()) {
      throw new AppError(400, "Hãy dùng chức năng rời nhóm");
    }
    if (isOwner(conversation, targetId)) {
      throw new AppError(403, "Không thể xóa chủ nhóm");
    }
    // phó nhóm không được xóa phó nhóm khác
    if (isAdmin(conversation, targetId) && !isOwner(conversation, user._id)) {
      throw new AppError(403, "Chỉ chủ nhóm mới xóa được phó nhóm");
    }
    const updated = await convoRepo.update(conversation._id, {
      $pull: {
        participants: { userId: targetId },
        "group.admins": targetId,
        pinnedBy: targetId,
        mutedBy: targetId,
      },
    });
    emitToUser(targetId, "remove-conversation", { conversation: updated });
    removeUsersFromRoom([targetId], conversation._id);
    await broadcastConversation(conversation._id);
    return { conversation: updated };
  },

  renameGroup: async ({ params, body, user }) => {
    const conversation = await getGroupForMember(params.conversationId, user._id);
    assertCanManage(conversation, user._id);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 100) {
      throw new AppError(400, "Tên nhóm phải từ 1 đến 100 ký tự");
    }
    await convoRepo.update(conversation._id, { $set: { "group.name": name } });
    const updated = await broadcastConversation(conversation._id);
    return { conversation: updated };
  },

  setAdmin: async ({ params, body, user }) => {
    const conversation = await getGroupForMember(params.conversationId, user._id);
    if (!isOwner(conversation, user._id)) {
      throw new AppError(403, "Chỉ chủ nhóm mới phân quyền được");
    }
    const targetId = params.userId;
    const inGroup = conversation.participants.some((p) => idOf(p.userId) === targetId);
    if (!inGroup || isOwner(conversation, targetId)) {
      throw new AppError(400, "Thành viên không hợp lệ");
    }
    await convoRepo.update(
      conversation._id,
      body.admin
        ? { $addToSet: { "group.admins": targetId } }
        : { $pull: { "group.admins": targetId } }
    );
    const updated = await broadcastConversation(conversation._id);
    return { conversation: updated };
  },

  transferOwner: async ({ params, user }) => {
    const conversation = await getGroupForMember(params.conversationId, user._id);
    if (!isOwner(conversation, user._id)) {
      throw new AppError(403, "Chỉ chủ nhóm mới chuyển quyền được");
    }
    const targetId = params.userId;
    const inGroup = conversation.participants.some((p) => idOf(p.userId) === targetId);
    if (!inGroup || targetId === user._id.toString()) {
      throw new AppError(400, "Thành viên không hợp lệ");
    }
    await convoRepo.update(conversation._id, {
      $set: { "group.createdBy": targetId },
      $pull: { "group.admins": targetId },
    });
    const updated = await broadcastConversation(conversation._id);
    return { conversation: updated };
  },

  // ghim / tắt thông báo là cài đặt riêng của từng người
  setPersonal: async ({ params, body, user }) => {
    if (!["pin", "mute"].includes(params.setting)) {
      throw new AppError(400, "Cài đặt không hợp lệ");
    }
    const conversation = await getConvoForMember(params.conversationId, user._id);
    const field = params.setting === "pin" ? "pinnedBy" : "mutedBy";
    const updated = await convoRepo.update(
      conversation._id,
      body.value
        ? { $addToSet: { [field]: user._id } }
        : { $pull: { [field]: user._id } }
    );
    emitToUser(user._id, "conversation-updated", { conversation: updated });
    return { conversation: updated };
  },

  searchMessages: async ({ params, query, user }) => {
    await getConvoForMember(params.conversationId, user._id);
    const q = typeof query.q === "string" ? query.q.trim() : "";
    if (!q || q.length > 100) {
      throw new AppError(400, "Từ khóa phải từ 1 đến 100 ký tự");
    }
    // escape ký tự đặc biệt để không bị tấn công regex
    const regex = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const messages = await messRepo.search({
      conversationId: params.conversationId,
      regex,
      limit: 30,
    });
    return { messages };
  },

  pinMessage: async ({ params, body, user }) => {
    const message = await messRepo.findById(params.messageId);
    if (!message) throw new AppError(404, "Không tìm thấy tin nhắn");
    const conversation = await getConvoForMember(message.conversationId, user._id);
    if (body.pinned) {
      if (message.deletedAt) throw new AppError(400, "Tin nhắn đã được thu hồi");
      const pinned = conversation.pinnedMessages ?? [];
      if (
        !pinned.some((id) => id.toString() === message._id.toString()) &&
        pinned.length >= MAX_PINNED_MESSAGES
      ) {
        throw new AppError(
          400,
          `Chỉ ghim được tối đa ${MAX_PINNED_MESSAGES} tin nhắn`
        );
      }
    }
    await convoRepo.update(
      conversation._id,
      body.pinned
        ? { $addToSet: { pinnedMessages: message._id } }
        : { $pull: { pinnedMessages: message._id } }
    );
    const updated = await broadcastConversation(conversation._id);
    return { conversation: updated };
  },

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
