import ConversationModel from "../models/ConversationModel.js";
import FriendModel from "../models/FriendModel.js";
import FriendRequestModel from "../models/FriendRequestModel.js";
import MessageModel from "../models/MessageModel.js";
import Sesstion from "../models/SesstionModel.js";
import User from "../models/UserModel.js";

export const authRepo = {
  existUser: async ({ _id }) => {
    return await User.exists({ _id });
  },
  infoUserId: async ({ _id }) => {
    return await User.findById(_id).select("-hashedPassword");
  },
  findEmail: async ({ email }) => {
    return await User.findOne({ email });
  },
  seachEmail: async ({ email }) => {
    return await User.findOne({ email })
      .select("_id displayName avatarUrl email")
      .lean();
  },
  createUser: async ({ email, hashedPassword, displayName }) => {
    return await User.create({ email, hashedPassword, displayName });
  },
};

export const sesstionRepo = {
  createSesstion: async ({ userId, refreshToken, expiresAt }) => {
    return await Sesstion.create({ userId, refreshToken, expiresAt });
  },
  deleteSesstion: async ({ refreshToken }) => {
    return await Sesstion.deleteOne({ refreshToken });
  },
  findOneSesstion: async ({ refreshToken }) => {
    return await Sesstion.findOne({ refreshToken });
  },
};
export const friendRepo = {
  findOneFriend: async ({ userA, userB }) => {
    return await FriendModel.findOne({ userA, userB });
  },
  findFriend: async ({ _id }) => {
    return await FriendModel.find({ $or: [{ userA: _id }, { userB: _id }] })
      .populate("userA", "_id displayName avatarUrl")
      .populate("userB", "_id displayName avatarUrl")
      .lean();
  },
  createFriend: async ({ userA, userB }) => {
    return await FriendModel.create({
      userA: userA,
      userB: userB,
    });
  },
  deleteFriend: async (info) => {
    return await FriendModel.findOneAndDelete(info);
  },
};

export const requestRepo = {
  findOneRequest: async ({ to, from }) => {
    return await FriendRequestModel.findOne({
      $or: [
        { from, to },
        { from: to, to: from },
      ],
    });
  },
  findByIdRequest: async ({ requestId }) => {
    return await FriendRequestModel.findById(requestId).exec();
  },
  createRequestTo: async ({ from, to, message }) => {
    return await FriendRequestModel.create({ from, to, message }).then((data) =>
      data.populate("to", "_id displayName avatarUrl email")
    );
  },
  deleteIdRequest: async ({ requestId }) => {
    await FriendRequestModel.findByIdAndDelete(requestId);
  },
  findRequest: async ({ _id }) => {
    return await Promise.all([
      FriendRequestModel.find({ from: _id }).populate(
        "to",
        "_id displayName avatarUrl"
      ),
      FriendRequestModel.find({ to: _id }).populate(
        "from",
        "_id displayName avatarUrl"
      ),
    ]);
  },
};

export const convoRepo = {
  findDirectConvo: async ({ userA, userB }) => {
    return await ConversationModel.findOne({
      type: "direct",
      $and: [
        { "participants.userId": userA },
        { "participants.userId": userB },
      ],
    }).populate({
      path: "participants.userId",
      select: "displayName avatarUrl",
    });
  },
  createDirectConvo: async ({ userA, userB }) => {
    return await ConversationModel.create({
      type: "direct",
      participants: [{ userId: userA }, { userId: userB }],
    }).then((data) =>
      data.populate([
        {
          path: "participants.userId",
          select: "displayName avatarUrl",
        },
      ])
    );
  },
  createGroupConvo: async ({ name, userId, memberIds }) => {
    return await ConversationModel.create({
      type: "group",
      participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
      group: {
        name,
        createdBy: userId,
      },
      lastMessageAt: new Date(),
    }).then((data) =>
      data.populate([
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
      ])
    );
  },
  deleteConvo: async ({ conversationId }) => {
    await ConversationModel.findByIdAndDelete(conversationId);
  },
  findAllConvo: async ({ _id }) => {
    return await ConversationModel.find({
      "participants.userId": _id,
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
  },
  findSocketID: async (userId) => {
    return await ConversationModel.find(
      { "participants.userId": userId },
      { _id: 1 }
    );
  },
  findId: async (conversationId) => {
    return await ConversationModel.findById(conversationId);
  },
  leaveGroup: async ({ conversationId, userId }) => {
    return await ConversationModel.findByIdAndUpdate(
      conversationId,
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
  },
  updateConvo: async ({ conversation, message, isSenderId }) => {
    const senderId = isSenderId._id.toString();
    const updateOperations = {
      $set: {
        seenBy: [senderId], // Người gửi mặc định đã xem
        lastMessageAt: message.createdAt,
        lastMessage: {
          _id: message._id,
          content: message.content,
          senderId: isSenderId,
          createdAt: message.createdAt,
        },
        // Reset số tin chưa đọc của người gửi về 0
        [`unreadCounts.${senderId}`]: 0,
      },
      $inc: {}, // Khởi tạo object cho phép cộng dồn
    };
    conversation.participants.forEach((participant) => {
      const id = participant.userId.toString();

      // Nếu không phải người gửi -> Cộng thêm 1 vào unreadCounts
      if (id !== isSenderId._id.toString()) {
        // Cú pháp: "unreadCounts.ID_CUA_USER" : 1
        updateOperations.$inc[`unreadCounts.${id}`] = 1;
      }
    });
    return await ConversationModel.findByIdAndUpdate(
      conversation._id,
      updateOperations,
      { new: true }
    ).populate({
      path: "lastMessage.senderId",
      select: "displayName avatarUrl",
    });
  },
};
export const messRepo = {
  delete: async ({ conversationId }) => {
    await MessageModel.deleteMany({ conversationId });
  },
  findMessage: async ({ conversationId, limit, cursor }) => {
    const filter = { conversationId };
    if (cursor) filter.createdAt = { $lt: new Date(cursor) };
    return await MessageModel.find(filter)
      .populate("senderId", "displayName avatarUrl email")
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);
  },
  create: async ({ conversationId, content, senderId, imgUrl }) => {
    return await MessageModel.create({
      conversationId,
      senderId,
      content: content || "",
      imgUrl,
    }).then((data) => data.populate("senderId", "displayName avatarUrl email"));
  },
};
