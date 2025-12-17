import cloudinary from "../libs/cloudinary.js";
import User from "../models/UserModel.js";
import validator from "validator";

export const authMeController = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
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
    res.status(500).json({ message: "Lỗi hệ thống" });
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

    const isKeyword = validator.isEmail(keyword); // kiểm tra xem đúng email k
    if (!isKeyword) {
      return res.status(404).json({ message: "Vui lòng nhập đúng email" });
    }
    // tìm tt trong db

    const otherUser = await User.findOne({ email: keyword }).select(
      "_id displayName avatarUrl email"
    );

    return res.status(200).json({ otherUser });
  } catch (error) {
    console.error("Lỗi khi search user", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
