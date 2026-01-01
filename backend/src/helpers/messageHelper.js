export const emitMessage = (io, conversation, message) => {
  io.to(conversation._id.toString()).emit("new-message", {
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      seenBy: conversation.seenBy || [],
    },
    unreadCounts: conversation.unreadCounts,
  });
  // cập nhật trạng thái đã xem
};
