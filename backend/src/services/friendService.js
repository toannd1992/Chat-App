import mongoose from "mongoose";
import {
  authRepo,
  convoRepo,
  friendRepo,
  messRepo,
  requestRepo,
} from "../repositories/authRepo.js";
import AppError from "../libs/appError.js";
import { emitToUser, joinUsersToRoom, removeUsersFromRoom } from "../socket/index.js";

export const friendService = {
  send: async ({ body, user }) => {
    const { to, message } = body;
    const from = user._id;

    // check gửi tin nhắn cho chính minhg
    if (from.toString() === to.toString()) {
      throw new AppError(400, "không thể gửi lời mời kết bạn cho chính mình");
    }
    // check người nhận có tồn tại không

    const userTo = await authRepo.existUser({ _id: to });
    if (!userTo) {
      throw new AppError(404, "Người dùng không tồn tại");
    }

    // check xem đã là bạn chưa và đã có lời mời kết bạn chưa

    let userA = from.toString();
    let userB = to.toString();

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadeFriend, existingRequest] = await Promise.all([
      friendRepo.findOneFriend({ userA, userB }),
      requestRepo.findOneRequest({
        to,
        from,
      }),
    ]);

    if (alreadeFriend) {
      throw new AppError(403, "Đã là bạn bè");
    }
    if (existingRequest) {
      throw new AppError(403, "Đã có lời mời đang chờ ");
    }
    // tạo lời mời kết bạn

    const request = await requestRepo.createRequestTo({
      from,
      to,
      message,
    });

    // báo cho người nhận (mọi tab đang mở)
    const fromUser = await authRepo.infoUserId({ _id: from });
    emitToUser(to, "friend:new-request", {
      ...request.toObject(),
      from: {
        _id: fromUser._id,
        displayName: fromUser.displayName,
        email: fromUser.email,
        avatarUrl: fromUser.avatarUrl,
      },
      to: to.toString(),
    });

    return { message: "Gửi lời mời kết bạn thành công", request };
  },
  accept: async ({ params, user }) => {
    const { requestId } = params;

    const userId = user._id;
    //check id lời mời có đúng mẫu với mongoose không

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError(400, "ID lời mời kết bạn không hợp lệ");
    }

    const request = await requestRepo.findByIdRequest({ requestId });

    // check lời mời kết bạn có trong FriendRequestModel không
    if (!request) {
      throw new AppError(400, "không tìm thấy lời mời kết bạn");
    }
    // check người nhận lời mời thì mới đc chấp nhận

    if (request.to.toString() !== userId.toString()) {
      throw new AppError(400, "Bạn không có quyền chấp nhận lời mời");
    }
    // tạo bạn bè

    const friend = await friendRepo.createFriend({
      userA: request.from,
      userB: request.to,
    });
    // xóa lời mời kết bạn trong db
    if (friend) {
      await requestRepo.deleteIdRequest({ requestId });
    }

    // lấy thông tin của người gửi

    const from = await authRepo.infoUserId({ _id: request.from });

    // check trước khi tạo tránh tạo thêm
    const existed = await convoRepo.findDirectConvo({
      userA: userId,
      userB: from._id,
    });

    // dùng lại hội thoại cũ nếu có, không thì tạo mới
    const conversation =
      existed ||
      (await convoRepo.createDirectConvo({
        userA: userId,
        userB: from._id,
      }));

    const infoUser = await authRepo.infoUserId({ _id: userId });
    const friendInfo = {
      _id: infoUser._id,
      displayName: infoUser.displayName,
      avatarUrl: infoUser.avatarUrl,
    };

    // cho cả hai vào room và báo cho người gửi lời mời
    joinUsersToRoom([userId, from._id], conversation._id);
    emitToUser(from._id, "new-friend", {
      friend: friendInfo,
      requestId,
      conversation,
    });

    return {
      conversation,
      from,
      friend: friendInfo,
      requestId,
    };
  },
  decline: async ({ params, user }) => {
    const { requestId } = params;

    const userId = user._id;
    //check id lời mời có đúng mẫu với mongoose không

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError(400, "ID lời mời kết bạn không hợp lệ");
    }

    const request = await requestRepo.findByIdRequest({ requestId });

    // check lời mời kết bạn có trong FriendRequestModel không
    if (!request) {
      throw new AppError(400, "không tìm thấy lời mời kết bạn");
    }
    // check người nhận lời mời thì mới đc chấp nhận

    if (request.to.toString() !== userId.toString()) {
      throw new AppError(400, "Bạn không có quyền từ chối lời mời");
    }

    // xóa lời mời kết bạn trong db

    await requestRepo.deleteIdRequest({ requestId });

    emitToUser(request.from, "decline-friend", { requestId });

    return { userId: request.from, requestId };
  },
  cancel: async ({ params, user }) => {
    const { requestId } = params;

    const userId = user._id;
    //check id lời mời có đúng mẫu với mongoose không

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError(400, "ID lời mời kết bạn không hợp lệ");
    }

    const request = await requestRepo.findByIdRequest({ requestId });

    // check lời mời kết bạn có trong FriendRequestModel không
    if (!request) {
      throw new AppError(400, "không tìm thấy lời mời kết bạn");
    }
    // check người nhận lời mời thì mới đc chấp nhận

    if (request.from.toString() !== userId.toString()) {
      throw new AppError(400, "Bạn không có quyền hủy lời mời");
    }

    // xóa lời mời kết bạn trong db

    await requestRepo.deleteIdRequest({ requestId });

    emitToUser(request.to, "decline-friend", { requestId });

    return { userId: request.to, requestId };
  },
  getAll: async ({ _id }) => {
    // tìm trong db
    const listFriends = await friendRepo.findFriend({ _id });

    if (!listFriends.length) {
      return { friends: [] };
    }

    const friends = listFriends.map((item) =>
      item.userA._id.toString() === _id.toString() ? item.userB : item.userA
    );

    return { friends };
  },
  getReq: async ({ _id }) => {
    // tìm lời mời trong db
    const [requestFrom, requestTo] = await requestRepo.findRequest({ _id });

    return { requestFrom: requestFrom, requestTo: requestTo };
  },
  delete: async ({ params, user }) => {
    const userA = user._id.toString();
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, "ID người dùng không hợp lệ");
    }

    const PairHelper = (a, b) => {
      return a < b ? { userA: a, userB: b } : { userA: b, userB: a };
    };
    const pair = PairHelper(userA, id);
    // tìm info để trả về cho frontend để úpdate store
    const userinfo = await authRepo.infoUserId({ _id: user._id });
    const otherUser = await authRepo.infoUserId({ _id: id });

    // xóa bạn bè trong db
    const friend = await friendRepo.deleteFriend(pair);
    if (!friend) {
      throw new AppError(404, "Không phải là bạn bè");
    }
    // tìm kiếm cuộc hội thoại và xóa luôn
    const conversation = await convoRepo.findDirectConvo({
      userA: userA,
      userB: id,
    });

    if (conversation) {
      // xóa tất cả tin nhắn liên quan đến cuộc hội thoại
      await messRepo.delete({ conversationId: conversation._id });
      // xóa luôn cuộc hội thoại
      await convoRepo.deleteConvo({ conversationId: conversation._id });
    }

    // báo cho người kia và cho cả hai rời room
    emitToUser(id, "delete-friend", { user: userinfo, conversation });
    if (conversation) {
      removeUsersFromRoom([userA, id], conversation._id);
    }

    return {
      user: userinfo,
      otherUser,
      conversation,
    };
  },
};
