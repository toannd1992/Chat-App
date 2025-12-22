import mongoose from "mongoose";
import FriendModel from "../models/FriendModel.js";
import User from "../models/UserModel.js";
import FriendRequestModel from "../models/FriendRequestModel.js";
import ConversationModel from "../models/ConversationModel.js";
import MessageModel from "../models/MessageModel.js";

export const sendFriend = async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user._id;

    // check gửi tin nhắn cho chính minhg
    if (from.toString() === to.toString()) {
      return res
        .status(400)
        .json({ message: "không thể gửi lời mời kết bạn cho chính mình" });
    }
    // check người nhận có tồn tại không

    const userTo = await User.exists({ _id: to });
    if (!userTo) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // check xem đã là bạn chưa và đã có lời mời kết bạn chưa

    let userA = from.toString();
    let userB = to.toString();

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadeFriend, existingRequest] = await Promise.all([
      FriendModel.findOne({ userA, userB }),
      FriendRequestModel.findOne({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      }),
    ]);

    if (alreadeFriend) {
      return res.status(400).json({ message: "Đã là bạn bè" });
    }
    if (existingRequest) {
      return res.status(400).json({ message: "Đã có lời mời đang chờ " });
    }
    // tạo lời mời kết bạn

    const request = await FriendRequestModel.create({
      from,
      to,
      message,
    });
    await request.populate("to", "_id displayName avatarUrl email");
    return res
      .status(200)
      .json({ message: "Gửi lời mời kết bạn thành công", request });
  } catch (error) {
    console.error("lỗi khi gửi kết bạn", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const userId = req.user._id;
    //check id lời mời có đúng mẫu với mongoose không?

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res
        .status(400)
        .json({ message: "ID lời mời kết bạn không hợp lệ" });
    }

    const request = await FriendRequestModel.findById(requestId).exec();

    // check lời mời kết bạn có trong FriendRequestModel không
    if (!request) {
      res.status(404).json({ message: "không tìm thấy lời mời kết bạn" });
    }
    // check người nhận lời mời thì mới đc chấp nhận

    if (request.to.toString() !== userId.toString()) {
      return res
        .status(404)
        .json({ message: "Bạn không có quyền chấp nhận lời mời" });
    }
    // tạo bạn bè

    const friend = await FriendModel.create({
      userA: request.from,
      userB: request.to,
    });
    // xóa lời mời kết bạn trong db
    if (friend) {
      await FriendRequestModel.findByIdAndDelete(requestId);
    }

    // lấy thông tin của người gửi

    const from = await User.findById(request.from)
      .select("_id displayName avatarUrl")
      .lean();

    // check trước khi tạo tránh tạo thêm

    const existed = await ConversationModel.findOne({
      type: "direct",
      participants: {
        $all: [
          { $elemMatch: { userId } },
          { $elemMatch: { userId: from._id } },
        ],
      },
    });

    if (existed) {
      return res.status(200).json({
        conversation: existed,
        from,
        friend: {
          _id: userId,
          displayName: req.user.displayName,
          avatarUrl: req.user.avatarUrl,
        },
        requestId, // id lời mời
      });
    }

    // tạo conversation khi đã là bạn bè
    const conversation = await ConversationModel.create({
      type: "direct",
      participants: [{ userId }, { userId: from._id }],
    });
    // pupulate thông tin
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

    res.status(200).json({
      conversation,
      from,
      friend: {
        _id: userId,
        displayName: req.user.displayName,
        avatarUrl: req.user.avatarUrl,
      },
      requestId,
    });
  } catch (error) {
    console.error("lỗi khi đồng ý kết bạn", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    // lây thông tin
    const { requestId } = req.params;
    const userId = req.user._id;

    // id hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res
        .status(400)
        .json({ message: "ID lời mời kết bạn không hợp lệ" });
    }

    //check đúng người gửi lời mời kết bạn
    const request = await FriendRequestModel.findById(requestId);

    if (!request) {
      res.status(404).json({ message: "không tìm thấy lời mời kết bạn" });
    }

    if (request.to.toString() !== userId.toString()) {
      return res
        .status(400)
        .json({ message: "Bạn không có quyền từ chối lời mời" });
    }

    // delete lời mời

    await FriendRequestModel.findByIdAndDelete(requestId);
    return res.status(200).json({ userId, requestId });
  } catch (error) {
    console.error("lỗi khi từ chối kết bạn", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};
export const cancelFriendRequest = async (req, res) => {
  try {
    // lây thông tin
    const { requestId } = req.params;
    const userId = req.user._id;

    // id hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res
        .status(400)
        .json({ message: "ID lời mời kết bạn không hợp lệ" });
    }

    //check đúng người gửi lời mời kết bạn
    const request = await FriendRequestModel.findById(requestId);
    console.log(request);

    if (!request) {
      res.status(404).json({ message: "không tìm thấy lời mời kết bạn" });
    }

    if (request.from.toString() !== userId.toString()) {
      return res
        .status(400)
        .json({ message: "Bạn không có quyền hủy lời mời" });
    }

    // delete lời mời

    await FriendRequestModel.findByIdAndDelete(requestId);
    return res.status(200).json({ userId: request.to, requestId });
  } catch (error) {
    console.error("lỗi khi Hủy lời mời kết", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};

export const getAllFriends = async (req, res) => {
  try {
    // lấy userId từ req.user
    const userId = req.user._id;

    // tìm trong db
    const listFriends = await FriendModel.find({
      $or: [{ userA: userId }, { userB: userId }],
    })
      .populate("userA", "_id displayName avatarUrl")
      .populate("userB", "_id displayName avatarUrl")
      .lean();

    if (!listFriends.length) {
      return res.status(400).json({ friends: [] });
    }

    const friends = listFriends.map((item) =>
      item.userA._id.toString() === userId.toString() ? item.userB : item.userA
    );

    return res.status(200).json({ friends });
  } catch (error) {
    console.error("lỗi khi lấy danh sách kết bạn", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};

export const getFriendsRequest = async (req, res) => {
  try {
    const userId = req.user._id;

    // tìm lời mời trong db
    const [requestFrom, requestTo] = await Promise.all([
      FriendRequestModel.find({ from: userId }).populate(
        "to",
        "_id displayName avatarUrl"
      ),
      FriendRequestModel.find({ to: userId }).populate(
        "from",
        "_id displayName avatarUrl"
      ),
    ]);

    // const requestFriend = await FriendRequestModel.find({
    //   $or: [{ to: userId }, { from: userId }],
    // })
    //   .populate("from", "_id displayName avatarUrl")
    //   .populate("to", "_id displayName avatarUrl");

    // // return res.status(400).json({ requestFriend });
    // if (!requestFriend.length) {
    //   return res.status(400).json({ requestFrom: [], requestTo: [] });
    // }

    // const requestFrom = requestFriend.map((item) =>
    //   item.from._id.toString() === userId.toString() ? item.to : item.from
    // );
    // const requestTo = requestFriend.map((item) =>
    //   item.to._id.toString() === userId.toString() ? item.from : ""
    // );

    return res
      .status(200)
      .json({ requestFrom: requestFrom, requestTo: requestTo });
  } catch (error) {
    console.error("lỗi khi lấy danh sách yêu cầu kết bạn", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};

export const deleteFriend = async (req, res) => {
  try {
    const userA = req.user._id.toString();
    const { id } = req.params;

    const PairHelper = (a, b) => {
      return a < b ? { userA: a, userB: b } : { userA: b, userB: a };
    };
    const pair = PairHelper(userA, id);
    // tìm otherUser để trả về cho frontend để úpdate store
    const otherUser = await User.findById(id).select(
      "_id displayName avatarUrl"
    );

    // xóa bạn bè trong db
    const friend = await FriendModel.findOneAndDelete(pair);
    if (!friend) {
      return res.status(404).json({ message: "Không phải là bạn bè" });
    }
    // tìm kiếm cuộc hội thoại và xóa luôn
    const conversation = await ConversationModel.findOne({
      type: "direct",
      "participants.userId": { $all: [userA, id] },
    });
    if (conversation) {
      // xóa tất cả tin nhắn liên quan đến cuộc hội thoại
      await MessageModel.deleteMany({ conversationId: conversation._id });
      // xóa luôn cuộc hội thoại
      await ConversationModel.findByIdAndDelete(conversation._id);
    }
    return res.status(200).json({
      user: {
        _id: req.user._id,
        displayName: req.user.displayName,
        avatarUrl: req.user.avatarUrl,
      },
      otherUser,
      conversation,
    });
  } catch (error) {
    console.error("lỗi khi hủy kết bạn", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};
