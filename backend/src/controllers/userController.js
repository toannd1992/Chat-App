import cloudinary from "../libs/cloudinary.js";
import FriendModel from "../models/FriendModel.js";
import FriendRequestModel from "../models/FriendRequestModel.js";
import User from "../models/UserModel.js";
import validator from "validator";

export const authMeController = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// update user

export const updateAvatarController = async (req, res) => {
  try {
    const { avatar } = req.body;
    const id = req.user._id;
    let avatarUrl;
    let avatarId;
    // nếu có avatar thì upload ảnh
    if (avatar) {
      const upload = await cloudinary.uploader.upload(avatar);
      avatarUrl = upload.secure_url;
      avatarId = upload.public_id;
    }

    // tìm user trong db

    const user = await User.findById(id).select("-hashedPassword");
    user.set({
      avatarUrl,
      avatarId,
    });
    await user.save();
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi update avatar", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateProfileController = async (req, res) => {
  try {
    const { displayName, phone, birthday, gender } = req.body;
    const id = req.user._id;

    if (!displayName && !phone && !birthday && !gender) {
      return res
        .status(404)
        .json({ message: "Không thấy nội dung cần update" });
    }

    // tìm user trong db để update

    const user = await User.findById(id).select("-hashedPassword -avatarId");
    user.set({
      displayName,
      phone,
      birthday,
      gender,
    });

    await user.save();

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi update profile", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};

export const searchUserController = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa" });
    }

    const isKeyword = validator.isEmail(keyword);
    if (!isKeyword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đúng định dạng email" });
    }

    // thêm .lean() để trả về object thuần js
    const otherUser = await User.findOne({ email: keyword })
      .select("_id displayName avatarUrl email")
      .lean();

    if (!otherUser) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // nếu tìm thấy chính mình thì trả về luôn
    if (otherUser._id.toString() === req.user._id.toString()) {
      return res.status(200).json({
        user: { ...otherUser, isMe: true },
      });
    }

    // check xem đã là bạn chưa và đã có lời mời kết bạn chưa
    const to = otherUser._id;
    const from = req.user._id;
    let friend = false;
    let request = false;

    // sắp xếp id để check friend
    let userA = from.toString();
    let userB = to.toString();
    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadyFriend, existingRequest] = await Promise.all([
      FriendModel.findOne({ userA, userB }),
      FriendRequestModel.findOne({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
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

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi search user", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
