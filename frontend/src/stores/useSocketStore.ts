import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import type { SocketState } from "@/types/typeStore";
import { useFriendStore } from "./useFriendStore";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  userOnline: [],

  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const isSocket = get().socket;

    if (isSocket) return;

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket: socket });

    // socket.on("connect", () => {
    //   console.log("Đã kết nối với socket");
    // });
    //online
    socket.on("user-online", (userId) => {
      set({ userOnline: userId });
    });
    // lắng nghe sự kiện tạo group
    socket.on("new-group", ({ conversation }) => {
      // thêm conversation
      useChatStore.getState().updateConversation(conversation);
    });
    // lắng nghe sự kiện xoas conversation
    socket.on("remove-conversation", ({ conversation }) => {
      // thêm conversation
      useChatStore.getState().removeConversation(conversation);
    });

    // lắng nghe sự kiện leave-success
    socket.on("member-leave", ({ conversation }) => {
      // thêm conversation

      useChatStore.getState().updateConversation(conversation);
    });
    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      const { activeConversationId, addMessage, updateConversation } =
        useChatStore.getState();
      const { user } = useAuthStore.getState();
      // thêm tin nhắn mới vào danh sách
      addMessage(message);

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        senderId: {
          _id: conversation.lastMessage.senderId._id,
          displayName: conversation.lastMessage.senderId.displayName,
        },
      };
      //updateConvo theo dữ liệu server
      let updateConvo = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };
      // nếu người dùng đang chọn cuộc hội thoại thì đánh dấu đã đọc
      if (activeConversationId === message.conversationId) {
        socket.emit("mark-as-seen", { conversationId: message.conversationId });

        updateConvo = {
          ...conversation,
          lastMessage,
          unreadCounts: {
            ...updateConvo.unreadCounts,
            [user?._id as string]: 0, // reset số tin chưa đọc của mình về 0
          },
          seenBy: conversation.seenBy.includes(user?._id)
            ? conversation.seenBy
            : [...conversation.seenBy, user?._id],
        };
      }

      updateConversation(updateConvo);
    });

    // lằng nghe sự kiện đã xem
    socket.on(
      "conversation-seen",
      ({ conversationId, seenBy, unreadCounts }) => {
        const { conversations, updateSeenConversation } =
          useChatStore.getState();

        // Tìm cuộc hội thoại cần update
        const convo = conversations.find((c) => c._id === conversationId);
        if (convo) {
          updateSeenConversation({
            ...convo,
            seenBy: seenBy, // Cập nhật danh sách người đã xem mới
            unreadCounts: unreadCounts, // Cập nhật lại số tin chưa đọc
          });
        }
      }
    );

    // lắng nghe sự kiện gửi request kết bạn
    socket.on("friend:new-request", (data) => {
      // add lời mời vào store
      useFriendStore.getState().addRequest(data);
    });
    // lắng nghe sự kiện gửi đồng ý kết bạn
    socket.on("new-friend", ({ friend, requestId, conversation }) => {
      // add bạn bè vào store

      useFriendStore.getState().addFriend(friend);
      // xóa lời mời
      useFriendStore.getState().setRequest(requestId);
      // thêm conversation
      useChatStore.getState().updateConversation(conversation);
    });
    // lắng nghe sự kiện gửi từ chối kết bạn
    socket.on("decline-friend", ({ requestId }) => {
      // xóa lời mời
      useFriendStore.getState().setRequest(requestId);
    });
    // lắng nghe sự kiện xóa kết bạn
    socket.on("delete-friend", ({ user, conversation }) => {
      // xóa lời mời
      useFriendStore.getState().removeFriend(user._id.toString());
      useChatStore.getState().removeConversation(conversation);
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
  messagesAsSeen: (conversationId: string) => {
    const socket = get().socket;
    const { user } = useAuthStore.getState();
    const { conversations, updateSeenConversation } = useChatStore.getState();

    // Gửi sự kiện lên server
    if (socket) {
      socket.emit("mark-as-seen", { conversationId });
    }

    // Cập nhật UI ngay lập tức (để mất số đỏ unread badge)
    const convo = conversations.find((c) => c._id === conversationId);
    // console.log(convo);
    if (convo) {
      updateSeenConversation({
        ...convo,
        unreadCounts: {
          ...convo.unreadCounts,
          [user?._id as string]: 0,
        },
        // Lưu ý: seenBy sẽ được cập nhật chính xác khi server trả về event "conversation-seen"
      });
    }
  },
}));
