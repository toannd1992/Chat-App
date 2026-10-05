import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
    },
    imgUrl: {
      type: String,
    },
    // trả lời một tin nhắn khác
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessageModel",
      default: null,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    // thu hồi: nội dung bị xóa nhưng giữ lại chỗ trong cuộc trò chuyện
    deletedAt: {
      type: Date,
      default: null,
    },
    reactions: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          emoji: { type: String },
          _id: false,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
const MessageModel = mongoose.model("MessageModel", messageSchema);
export default MessageModel;
