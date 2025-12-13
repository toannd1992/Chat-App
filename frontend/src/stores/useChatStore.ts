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

      setActiveConversation: (id) => set({ activeConversationId: id }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          loading: false,
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
      sendDirectMessStore: async (recipientId, content, imgUrl) => {
        try {
          const { activeConversationId } = get();

          await chatServices.sendDirectMess({
            conversationId: activeConversationId || undefined,
            recipientId,
            content,
            imgUrl,
          });
          set((state) => ({
            conversations: state.conversations.map((item) =>
              item._id === activeConversationId ? { ...item, seenBy: [] } : item
            ),
          }));
        } catch (error) {
          console.error("Lỗi khi gửi tin nhắn direct", error);
        }
      },
      sendGroupMessStore: async (content, conversationId, imgUrl) => {
        try {
          const { activeConversationId } = get();
          const convoId = conversationId || activeConversationId;
          if (!convoId) {
            console.error("Không tìm thấy nhóm để gửi tin nhắn");
            return;
          }
          await chatServices.sendGroupMess({
            conversationId: convoId,
            content,
            imgUrl,
          });
          set((state) => ({
            conversations: state.conversations.map((item) =>
              item._id === activeConversationId ? { ...item, seenBy: [] } : item
            ),
          }));
        } catch (error) {
          console.error("lỗi khi gửi tin nhăn group", error);
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
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c
          ),
        }));
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);
