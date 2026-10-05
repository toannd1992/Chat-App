import validator from "validator";
import { authRepo, friendRepo, requestRepo } from "../repositories/authRepo.js";
import AppError from "../libs/appError.js";
import { uploadImageOnly } from "../libs/upload.js";

export const userService = {
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
