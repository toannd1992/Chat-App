// update người xem, người gửi, tin nhắn cuối conversation khi gửi tin nhắn vào
export const updateConversation = (conversation, message, isSenderId) => {
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId: isSenderId,
      createdAt: message.createdAt,
    },
  });

  conversation.participants.forEach((item) => {
    const isSender = item.userId.toString() === isSenderId._id.toString();
    const count = conversation.unreadCounts.get(item.userId.toString()) || 0;

    conversation.unreadCounts.set(
      item.userId.toString(),
      isSender ? 0 : count + 1
    );
  });
};

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
