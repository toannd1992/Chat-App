import { chatServices } from "@/services/chatServices";
import type { ChatState } from "@/types/typeStore";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      loading: false,
      loadingMessage: false,
      replyingTo: null,
      editingMessage: null,

      // đổi hội thoại thì bỏ trạng thái đang trả lời / đang sửa
      setActiveConversation: (id) =>
        set({ activeConversationId: id, replyingTo: null, editingMessage: null }),
      setReplyingTo: (message) =>
        set({ replyingTo: message, editingMessage: null }),
      setEditingMessage: (message) =>
        set({ editingMessage: message, replyingTo: null }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          loading: false,
          replyingTo: null,
          editingMessage: null,
        });
      },
      fetchConversations: async () => {
        try {
          set({ loading: true });
          const { conversations } = await chatServices.fetchConversations();
          set({ conversations });
        } catch (error) {
          console.error("lỗi khi gọi fetchConversation", error);
        } finally {
          set({ loading: false });
        }
      },
      fetchMessages: async (conversationId) => {
        try {
          const { activeConversationId, messages } = get();
          const { user } = useAuthStore.getState();

          if (!user) return;
          const id = conversationId ?? activeConversationId;
          if (!id) return;
          // kiem tra tin nhan trong store
          const currentMessage = messages?.[id];
          // kiem tra nextcursor
          const nextCursor =
            currentMessage?.nextCursor === undefined
              ? ""
              : currentMessage.nextCursor;
          if (nextCursor === null) return;
          set({ loadingMessage: true });
          const { mess, cursor } = await chatServices.fetchMessage(
            id,
            nextCursor
          );
          const meMess = mess.map((item) => ({
            ...item,
            isOwn: item.senderId._id === user._id,
          }));

          set((state) => {
            const prev = state.messages[id]?.items ?? [];
            const merged = prev.length > 0 ? [...meMess, ...prev] : meMess;

            return {
              messages: {
                ...state.messages,
                [id]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("lỗi khi gọi getMessage", error);
        } finally {
          set({ loadingMessage: false });
        }
      },
      sendDirectMessStore: async (recipientId, content, imgUrl, replyTo) => {
        try {
          set({ loadingMessage: true });
          const { activeConversationId } = get();

          await chatServices.sendDirectMess({
            conversationId: activeConversationId || undefined,
            recipientId,
            content,
            imgUrl,
            replyTo,
          });
          set({ replyingTo: null });
          set((state) => ({
            conversations: state.conversations.map((item) =>
              item._id === activeConversationId ? { ...item, seenBy: [] } : item
            ),
          }));
          return true;
        } catch (error) {
          console.error("Lỗi khi gửi tin nhắn direct", error);
          return false;
        } finally {
          set({ loadingMessage: false });
        }
      },
      sendGroupMessStore: async (content, conversationId, imgUrl, replyTo) => {
        try {
          const { activeConversationId } = get();
          const convoId = conversationId || activeConversationId;
          set({ loadingMessage: true });
          if (!convoId) {
            console.error("Không tìm thấy nhóm để gửi tin nhắn");
            return false;
          }
          await chatServices.sendGroupMess({
            conversationId: convoId,
            content,
            imgUrl,
            replyTo,
          });
          set({ replyingTo: null });
          set((state) => ({
            conversations: state.conversations.map((item) =>
              item._id === activeConversationId ? { ...item, seenBy: [] } : item
            ),
          }));
          return true;
        } catch (error) {
          console.error("lỗi khi gửi tin nhăn group", error);
          return false;
        } finally {
          set({ loadingMessage: false });
        }
      },
      // thay thế tin nhắn đã đổi (sửa, thu hồi, cảm xúc) và cập nhật bản xem trước
      updateMessage: (message, lastMessage) => {
        const { user } = useAuthStore.getState();
        set((state) => {
          const current = state.messages[message.conversationId];
          const messages = current
            ? {
                ...state.messages,
                [message.conversationId]: {
                  ...current,
                  items: current.items.map((m) =>
                    m._id === message._id
                      ? {
                          ...message,
                          isOwn: message.senderId._id === user?._id,
                        }
                      : m
                  ),
                },
              }
            : state.messages;
          const conversations = lastMessage
            ? state.conversations.map((c) =>
                c._id === message.conversationId ? { ...c, lastMessage } : c
              )
            : state.conversations;
          // đang sửa / trả lời đúng tin vừa bị thu hồi thì bỏ
          const gone = message.deletedAt;
          return {
            messages,
            conversations,
            editingMessage:
              gone && state.editingMessage?._id === message._id
                ? null
                : state.editingMessage,
            replyingTo:
              gone && state.replyingTo?._id === message._id
                ? null
                : state.replyingTo,
          };
        });
      },
      editMessage: async (messageId, content) => {
        try {
          await chatServices.editMessage(messageId, content);
          set({ editingMessage: null });
          return true;
        } catch (error) {
          console.error("Lỗi khi sửa tin nhắn", error);
          return false;
        }
      },
      recallMessage: async (messageId) => {
        try {
          await chatServices.recallMessage(messageId);
          return true;
        } catch (error) {
          console.error("Lỗi khi thu hồi tin nhắn", error);
          return false;
        }
      },
      reactMessage: async (messageId, emoji) => {
        try {
          await chatServices.reactMessage(messageId, emoji);
        } catch (error) {
          console.error("Lỗi khi thả cảm xúc", error);
        }
      },
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();
          message.isOwn = message.senderId._id === user?._id;
          const conversationId = message.conversationId;
          //kiểm tra xem có tin nhắn cũ chưa nếu chưa mở thì để mảng rỗng
          let item = get().messages[conversationId]?.items ?? [];
          // nếu chưa có thì fetch tin nhắn cũ
          if (item.length === 0) {
            await fetchMessages(conversationId);
            item = get().messages[conversationId].items ?? [];
          }
          // update vào tin nhắn trong store

          set((state) => {
            if (item.some((m) => m._id === message._id)) {
              return state;
            }
            return {
              messages: {
                ...state.messages,
                [conversationId]: {
                  items: [...item, message],
                  hasMore: state.messages[conversationId].hasMore,
                  nextCursor:
                    state.messages[conversationId].nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("lỗi khi addMessage", error);
        }
      },
      updateConversation: async (conversation) => {
        set((state) => {
          //tìm cuộc hội thoại cũ xem có không
          const isExist = state.conversations.find(
            (c) => c._id === conversation._id
          );

          // nếu có thì update còn chưa có thì lấy cuộc hội thoại mới

          const newConvo = isExist
            ? { ...isExist, ...conversation }
            : conversation;

          // lọc để xóa bỏ cuộc hội thoại cũ
          const otherConvo = state.conversations.filter(
            (c) => c._id !== conversation._id
          );

          // nếu có thì mới update
          return {
            conversations: [newConvo, ...otherConvo],
          };
        });
      },
      updateSeenConversation: async (conversation) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c
          ),
        }));
      },
      removeConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations.filter(
            (c) => c._id !== conversation._id
          ),
          // đang mở hội thoại bị xóa / bị mời ra khỏi nhóm thì đóng lại
          activeConversationId:
            state.activeConversationId === conversation._id
              ? null
              : state.activeConversationId,
        }));
      },
      patchConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c
          ),
        }));
      },

      createConversation: async (type, memberIds, name) => {
        try {
          const { conversation } = await chatServices.createConversation({
            type,
            memberIds,
            name,
          });
          if (conversation) {
            const { updateConversation, setActiveConversation, fetchMessages } =
              get();
            updateConversation(conversation);
            setActiveConversation(conversation._id);
            fetchMessages(conversation._id);
          }
        } catch (error) {
          console.error("Lỗi khi tạo nhóm chat", error);
        }
      },
      deleteConversation: async (conversationId, type) => {
        try {
          const { conversation } = await chatServices.deleteConversation(
            conversationId,
            type
          );

          if (conversation) {
            const { removeConversation } = get();
            removeConversation(conversation);
            set({
              activeConversationId: null,
            });
          }
        } catch (error) {
          console.error("Lỗi khi tạo nhóm chat", error);
        }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);
