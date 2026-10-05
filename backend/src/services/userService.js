import bcrypt from "bcrypt";
import validator from "validator";
import {
  authRepo,
  friendRepo,
  requestRepo,
  sesstionRepo,
} from "../repositories/authRepo.js";
import { disconnectUser } from "../socket/index.js";
import AppError from "../libs/appError.js";
import { uploadImageOnly } from "../libs/upload.js";

export const userService = {
  // đổi mật khẩu: các thiết bị khác bị đăng xuất, thiết bị hiện tại giữ nguyên
  changePassword: async ({ body, user, cookies }) => {
    const { currentPassword, newPassword } = body;
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      throw new AppError(400, "Thiếu mật khẩu hiện tại hoặc mật khẩu mới");
    }
    if (newPassword.length < 6 || newPassword.length > 72) {
      throw new AppError(400, "Mật khẩu mới phải từ 6 đến 72 ký tự");
    }
    if (newPassword === currentPassword) {
      throw new AppError(400, "Mật khẩu mới phải khác mật khẩu hiện tại");
    }
    const account = await authRepo.findByIdWithPassword(user._id);
    if (!account) throw new AppError(404, "Không tìm thấy user");

    const match = await bcrypt.compare(currentPassword, account.hashedPassword);
    if (!match) throw new AppError(400, "Mật khẩu hiện tại không đúng");

    account.hashedPassword = await bcrypt.hash(newPassword, 10);
    await account.save();
    await sesstionRepo.deleteSessionsOfUser({
      userId: account._id,
      keepRefreshToken: cookies?.refreshToken,
    });
    return { message: "Đổi mật khẩu thành công" };
  },

  // đăng xuất khỏi mọi thiết bị (cả thiết bị đang dùng)
  logoutAll: async ({ user }) => {
    await sesstionRepo.deleteSessionsOfUser({ userId: user._id });
    disconnectUser(user._id);
    return { message: "Đã đăng xuất khỏi mọi thiết bị" };
  },

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
      const upload = await uploadImageOnly(avatar);
      avatarUrl = upload.url;
      avatarId = upload.publicId;
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
    if (displayName !== undefined && String(displayName).trim().length > 50) {
      throw new AppError(400, "Tên hiển thị quá dài");
    }
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
