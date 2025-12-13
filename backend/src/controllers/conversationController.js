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
    // const newConversation = conversations.map((item) => item.participants);
    // const format1 = newConversation.map((item) => item);
    // const format = newConversation.map((item) => ({
    //   id: item.userId?._id,
    //   displayName: item.userId?.displayName,
    //   avatarUrl: item.userId?.avatarUrl ?? null,
    //   joineAt: item.joineAt,
    // }));

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
