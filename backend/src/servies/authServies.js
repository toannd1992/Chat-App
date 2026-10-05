import bcrypt from "bcrypt";
import mongoose from "mongoose";
import crypto from "crypto";
import { io } from "../socket/index.js";
import {
  authRepo,
  convoRepo,
  friendRepo,
  messRepo,
  requestRepo,
  sesstionRepo,
} from "../repositories/authRepo.js";
import jwt from "jsonwebtoken";
import AppError from "../libs/appError.js";
import cloudinary from "../libs/cloudinary.js";
import validator from "validator";
import { emitMessage } from "../helpers/messageHelper.js";

const ACCESS_TOKEN_TTL = "30m"; // THỜI GIAN TỒN TẠI 15 PHÚT
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //THỜI GIAN HẾT HẠN 14 NGÀY

export const authServies = {
  register: async ({ fistname, lastname, email, password }) => {
    if (!password || !email || !fistname || !lastname) {
      throw new AppError(
        400,
        "Không thể thiếu email, password, fistName, lastName"
      );
    }

    // check email
    const checkEmail = await authRepo.findEmail({ email });

    if (checkEmail) {
      throw new AppError(409, "Email đã tồn tại");
    }

    // mã hóa password
    const hashedPassword = await bcrypt.hash(password, 10);

    // lưu DB
    const newUser = await authRepo.createUser({
      email,
      hashedPassword,
      displayName: `${fistname} ${lastname}`,
    });

    // return

    return {
      message: "Tạo tài khoản thành công",
      newUser: { email: newUser.email, displayName: newUser.displayName },
    };
  },
  login: async ({ email, password }) => {
    if (!email || !password) {
      throw new AppError(400, "Thiếu email hoặc password");
    }
    // tim username

    const user = await authRepo.findEmail({ email });

    if (!user) {
      throw new AppError(404, "Tài khoản không đúng");
    }

    // so sánh password
    const checkpass = await bcrypt.compare(password, user.hashedPassword);

    if (!checkpass) {
      throw new AppError(401, "Mật khẩu không đúng");
    }

    // tạo accesToken
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );
    // tạo refresh token

    const refreshToken = crypto.randomBytes(64).toString("hex");

    // tạo sesstion để lưu refreshToken vào database
    await sesstionRepo.createSesstion({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    return {
      accessToken,
      refreshToken,
      message: "Đăng nhập thành công",
    };
  },

  logout: async ({ refreshToken }) => {
    if (!refreshToken) {
      throw new AppError(400, "Nhập refreshToken");
    }
    const sesstion = await sesstionRepo.deleteSesstion({ refreshToken });
    return { sesstion };
  },
  refresh: async ({ refreshToken }) => {
    if (!refreshToken) {
      throw new AppError(400, "Nhập refreshToken");
    }
    const token = await sesstionRepo.findOneSesstion({ refreshToken });
    if (!token) {
      throw new AppError(404, "refreshToken không hợp lệ");
    }
    // kiểm tra refresh token hết hạn chưa
    if (token.expiresAt < new Date()) {
      throw new AppError(401, "token đã hết hạn");
    }

    // tạo access token mới
    const accessToken = jwt.sign(
      { userId: token.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );
    return { accessToken };
  },
};

export const userServies = {
  getMe: async ({ _id }) => {
    if (!_id) {
      throw new AppError(400, "Nhập userId");
    }

    const user = await authRepo.infoUserId({ _id });
    return { user };
  },
  updateAvatar: async ({ body, user: id }) => {
    const { avatar } = body;

    let avatarUrl;
    let avatarId;

    // nếu có avatar thì upload ảnh
    if (avatar) {
      const upload = await cloudinary.uploader.upload(avatar);
      avatarUrl = upload.secure_url;
      avatarId = upload.public_id;
    }

    // tìm user trong db

    const user = await authRepo.infoUserId(id);
    if (!user) {
      throw new AppError(404, "Không tìm thấy user");
    }
    user.set({
      avatarUrl,
      avatarId,
    });
    await user.save();
    return { user };
  },
  updateProfile: async ({ body, user: id }) => {
    const { displayName, phone, birthday, gender } = body;
    if (!displayName && !phone && !birthday && !gender) {
      throw new AppError(400, "Không thấy nội dung update");
    }
    const user = await authRepo.infoUserId(id);
    if (!user) {
      throw new AppError(404, "Không tìm thấy user");
    }
    user.set({
      displayName,
      phone,
      birthday,
      gender,
    });
    await user.save();
    return { user };
  },
  searchUser: async ({ query, user: id }) => {
    const { keyword } = query;
    if (!keyword) {
      throw new AppError(400, "Vui lòng nhập từ khóa");
    }

    const isKeyword = validator.isEmail(keyword);
    if (!isKeyword) {
      throw new AppError(400, "Vui lòng nhập đúng định dạng email");
    }

    // thêm .lean() để trả về object thuần js
    const otherUser = await authRepo.seachEmail({ email: keyword });
    if (!otherUser) {
      throw new AppError(404, "Người dùng không tồn tại");
    }

    // nếu tìm thấy chính mình thì trả về luôn
    if (otherUser._id.toString() === id._id.toString()) {
      return {
        user: { ...otherUser, isMe: true },
      };
    }

    // check xem đã là bạn chưa và đã có lời mời kết bạn chưa
    const to = otherUser._id;
    const from = id._id;
    let friend = false;
    let request = false;

    // sắp xếp id để check friend
    let userA = from.toString();
    let userB = to.toString();
    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadyFriend, existingRequest] = await Promise.all([
      friendRepo.findOneFriend({ userA, userB }),
      requestRepo.findOneRequest({
        to,
        from,
      }),
    ]);

    if (alreadyFriend) {
      friend = true;
    }

    // phân loại lời mời
    if (existingRequest) {
      request = true;
    }

    const user = {
      ...otherUser,
      friend,
      request,
    };

    return { user };
  },
};

export const friendServies = {
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

    if (existed) {
      const me = await authRepo.infoUserId({ _id: userId });
      return {
        conversation: existed,
        from,
        friend: {
          _id: userId,
          displayName: me.displayName,
          avatarUrl: me.avatarUrl,
        },
        requestId, // id lời mời
      };
    }

    // tạo conversation khi đã là bạn bè
    const conversation = await convoRepo.createDirectConvo({
      userA: userId,
      userB: from._id,
    });

    const infoUser = await authRepo.infoUserId(user);
    return {
      conversation,
      from,
      friend: {
        _id: infoUser._id,
        displayName: infoUser.displayName,
        avatarUrl: infoUser.avatarUrl,
      },
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
    return {
      user: userinfo,
      otherUser,
      conversation,
    };
  },
};

export const conversationServies = {
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
    let conversation;
    // nếu type là direct thì  kiểm tra

    if (type === "direct") {
      const participantId = memberIds[0];
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
        memberIds,
      });
    }

    if (!conversation) {
      throw new AppError(400, "type không hợp lệ");
    }

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
  getMess: async ({ params, query }) => {
    const { conversationId } = params;
    const { limit = 20, cursor } = query;

    let message = await messRepo.findMessage({ conversationId, limit, cursor });

    let nextCursor = null;

    if (message.length > Number(limit)) {
      const nextMessage = message[message.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      message.pop();
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

export const messageServies = {
  sendDirect: async ({ body, user }) => {
    const { recipientId, conversationId, content, imgUrl: image } = body;
    const senderId = user._id;

    let conversation;
    // nếu k có conten và ảnh
    if (!content && !image) {
      throw new AppError(400, "Nội dung và ảnh không thể để trống");
    }
    // kiểm tra ảnh nếu có thì upload
    let imgUrl = null;
    // let contentImg = "";
    if (image) {
      try {
        const upload = await cloudinary.uploader.upload(image);
        imgUrl = upload.secure_url;
        // contentImg = "Hình ảnh";
      } catch (error) {
        throw new AppError(500, "Lỗi upload ảnh");
      }
    }
    // tim conversation
    if (conversationId) {
      conversation = await convoRepo.findId(conversationId);
    }

    if (!conversation) {
      conversation = await convoRepo.createDirectConvo({
        userA: senderId,
        userB: recipientId,
      });
    }

    const message = await messRepo.create({
      conversationId: conversation._id,
      senderId: senderId,
      content,
      imgUrl,
    });

    // update lại conversation khi tin nhắn đc gửi

    const isSenderId = message.senderId;
    conversation = await convoRepo.updateConvo({
      conversation,
      message,
      isSenderId,
    });

    // update lại conversation khi tin nhắn đc gửi bằng socket.io
    emitMessage(io, conversation, message);
    return { message };
  },

  sendGroup: async ({ body, user, conversation }) => {
    const { conversationId, content, imgUrl: image } = body;

    const senderId = user._id; //req.user._id;
    // được lưu lại vào trong req từ middleware

    if (!content && !image) {
      throw new AppError(400, "Nội dung và ảnh không thể để trống");
    }
    // kiểm tra ảnh nếu có thì upload
    let imgUrl = null;
    // let contentImg = "";
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      imgUrl = upload.secure_url;
      // contentImg = "Hình ảnh";
    }
    const message = await messRepo.create({
      conversationId: conversation._id,
      senderId: senderId,
      content,
      imgUrl,
    });

    // update lại conversation khi tin nhắn đc gửi
    const isSenderId = message.senderId;

    conversation = await convoRepo.updateConvo({
      conversation,
      message,
      isSenderId,
    });

    emitMessage(io, conversation, message);
    return { message };
  },
};
