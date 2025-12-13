import FriendModel from "../models/FriendModel.js";

export const friendMiddleware = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;

    // kiểm tra đã là bạn chưa
    if (recipientId) {
      let userA = recipientId.toString();
      let userB = senderId.toString();

      if (userA > userB) {
        [userA, userB] = [userB, userA];
      }

      const checkFriend = await FriendModel.findOne({ userA, userB });

      if (!checkFriend) {
        return res
          .status(400)
          .json({ message: "Không thể gửi tin nhắn khi chưa là bạn bè" });
      }

      next();
    } else {
      return res
        .status(400)
        .json({ message: "Cần có recipientId trong req.body" });
    }
  } catch (error) {
    console.error("Lỗi qua friendMiddleware", error);
    res.status(500).json({ message: "lỗi hệ thống" });
  }
};
