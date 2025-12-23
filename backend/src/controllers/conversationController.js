import ConversationModel from "../models/ConversationModel.js";
import MessageModel from "../models/MessageModel.js";

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;
    // kiểm tra đầu vào
    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      memberIds.length === 0 ||
      !Array.isArray(memberIds)
    ) {
      return res
        .status(400)
        .json({ message: "Tên nhóm và thành viên là bắt buộc" });
    }
    let conversation;
    // nếu type là direct thì  kiểm tra
    if (type === "direct") {
      const participantId = memberIds[0];
      // tim trong db comversationModel
      conversation = await ConversationModel.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, participantId] },
      });
      // nếu không thấy thì tạo convesation mới
      if (!conversation) {
        conversation = new ConversationModel({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
        });

        await conversation.save();
      }
    }

    // nếu type là group thì tạo nhóm luôn k cần kiểm tra

    if (type === "group") {
      conversation = new ConversationModel({
        type: "group",
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "type không hợp lệ" });
    }

    await conversation.populate([
      {
        path: "participants.userId",
        select: "displayName avatarUrl",
      },
      {
        path: "seenBy",
        select: "displayName avatarUrl",
      },
      {
        path: "lastMessage.senderId",
        select: "displayName avatarUrl",
      },
    ]);
    return res.status(200).json({ conversation });
  } catch (error) {
    console.error("Lỗi khi tạo conversation", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};

export const getAllConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await ConversationModel.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl",
      })
      .populate({ path: "seenBy", select: "displayName avatarUrl" });

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

    return res.status(200).json({ conversations, newConversation });
  } catch (error) {
    console.error("Lỗi khi gọi getConversation", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};
export const getMessage = async (req, res) => {
  // /conversations/${conversationId}/message?limit=${limit}&cursor=${cursor}
  try {
    const { conversationId } = req.params;
    const { limit = 20, cursor } = req.query;

    const query = { conversationId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let message = await MessageModel.find(query)
      .populate("senderId", "displayName avatarUrl email")
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (message.length > Number(limit)) {
      const nextMessage = message[message.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      message.pop();
    }

    message = message.reverse();

    return res.status(200).json({ message, nextCursor });
  } catch (error) {
    console.error("Lỗi khi gọi getMessage", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};

export const getConversationSocket = async (userId) => {
  try {
    const conversationIds = await ConversationModel.find(
      { "participants.userId": userId },
      { _id: 1 }
    );
    return conversationIds.map((item) => item._id.toString());
  } catch (error) {
    console.error("lỗi khi getConversationSocket", error);
    return [];
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { type } = req.body;
    const userId = req.user._id;
    // tìm cuộc hội thoại
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc hội thoại" });
    }
    switch (type) {
      case "delete_convo":
        if (conversation.type !== "direct") {
          return res.status(400).json({
            message: "Chỉ được xóa hội thoại",
          });
        }

        const isMe = conversation.participants.some(
          (p) => p.userId.toString() === userId.toString()
        );
        if (!isMe) {
          return res.status(403).json({
            message: "Bạn không có quyền xóa hội thoại này",
          });
        }
        // xóa tin nhắn và cuộc hội thoại
        await Promise.all([
          ConversationModel.findByIdAndDelete(conversationId),
          MessageModel.deleteMany({ conversationId: conversationId }),
        ]);
        return res.status(200).json({
          message: "xóa hội thoại thành công",
          conversation,
          type,
        });
      case "delete_group":
        if (conversation.type !== "group") {
          return res.status(400).json({
            message: "Không phải hội thoại nhóm",
          });
        }
        if (conversation.group.createdBy.toString() !== userId.toString()) {
          return res
            .status(400)
            .json({ message: "Chủ phòng mới có thể xóa phòng" });
        }
        // xóa tin nhắn và cuộc hội thoại
        await Promise.all([
          ConversationModel.findByIdAndDelete(conversationId),
          MessageModel.deleteMany({ conversationId: conversationId }),
        ]);
        return res.status(200).json({
          message: "Giải tán nhóm thành công",
          conversation,
          type,
        });
      case "leave_group":
        if (conversation.type !== "group") {
          return res.status(400).json({
            message: "Chỉ áp dụng cho nhóm",
          });
        }
        const isUser = conversation.participants.some(
          (p) => p.userId.toString() === userId.toString()
        );

        if (!isUser) {
          return res
            .status(404)
            .json({ message: "Chỉ thành viên trong nhóm mới được rời nhóm" });
        }

        if (conversation.group.createdBy.toString() === userId.toString()) {
          return res.status(400).json({
            message: "Chủ nhóm không thể rời nhóm",
          });
        }
        const updatedConversation = await ConversationModel.findByIdAndUpdate(
          conversation._id,
          { $pull: { participants: { userId } } },
          { new: true } // trả document khi update
        )
          .populate({
            path: "participants.userId",
            select: "displayName avatarUrl",
          })
          .populate({
            path: "lastMessage.senderId",
            select: "displayName avatarUrl",
          })
          .populate({ path: "seenBy", select: "displayName avatarUrl" });

        return res.status(200).json({
          message: "Rời nhóm thành công",
          conversation: updatedConversation,
          type,
        });
      default:
        return res.status(400).json({
          message: "Type không hợp lệ",
        });
    }
  } catch (error) {
    console.error("Lỗi khi xóa group", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};
