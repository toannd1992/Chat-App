import mongoose, { trusted } from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // phó nhóm: được thêm/xóa thành viên và đổi tên nhóm
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    _id: false,
  }
);

const lastMessageSchema = new mongoose.Schema(
  {
    _id: { type: String },
    content: {
      type: String,
      default: null,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    participants: {
      type: [participantSchema],
      required: true,
    },
    group: {
      type: groupSchema,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: lastMessageSchema,
      default: null,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    // cài đặt riêng của từng người
    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // tin nhắn được ghim (dùng chung cho cả hội thoại)
    pinnedMessages: [
      { type: mongoose.Schema.Types.ObjectId, ref: "MessageModel" },
    ],
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({
  "participants.userId": 1,
  lastMessageAt: -1,
});

const ConversationModel = mongoose.model(
  "ConversationModel",
  conversationSchema
);

export default ConversationModel;
