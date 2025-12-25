import { friendServices } from "@/services/friendServices";
import type { FriendState } from "@/types/typeStore";
import { create } from "zustand";
import { useChatStore } from "./useChatStore";
import { useSocketStore } from "./useSocketStore";
import { useAuthStore } from "./useAuthStore";
import { persist } from "zustand/middleware";

export const useFriendStore = create<FriendState>()(
  persist(
    (set, get) => ({
      requestFrom: [],
      requestTo: [],
      friends: [],
      loading: false,
      reset: () => {
        set({
          requestFrom: [],
          requestTo: [],
          friends: [],
          loading: false,
        });
      },
      setRequest: (id) =>
        set((state) => ({
          requestTo: state.requestTo.filter((item) => item._id !== id),
          requestFrom: state.requestFrom.filter((item) => item._id !== id),
        })),
      addRequest: (newRequest) => {
        set((state) => ({
          requestTo: [newRequest, ...state.requestTo],
        }));
      },
      addFriend: (friend) => {
        set((state) => ({
          friends: [...state.friends, friend],
        }));
      },
      removeFriend: (otherId) => {
        set((state) => ({
          friends: state.friends.filter((f) => f._id !== otherId),
        }));
      },
      sendFriend: async (recipientId, message) => {
        try {
          const res = await friendServices.sendFriend(recipientId, message);

          set((state) => ({
            requestFrom: [...state.requestFrom, res.request],
          }));

          // gửi socket
          const socket = useSocketStore.getState().socket; // lấy socket
          const user = useAuthStore.getState().user; // lấy thông tin của người gửi
          if (socket && res.request) {
            socket.emit("friend:send-request", {
              to: recipientId,
              request: res.request,
              fromUser: user,
            });
          }
        } catch (error) {
          console.error("Lỗi khi gửi lời mời kết bạn", error);
        }
      },
      getFriendRequests: async () => {
        try {
          set({ loading: true });
          const res = await friendServices.getFriendRequests();
          set({ requestFrom: res.requestFrom, requestTo: res.requestTo });
        } catch (error) {
          console.error("Lỗi khi lấy lời mời kết bạn", error);
        } finally {
          set({ loading: false });
        }
      },
      acceptFriend: async (id) => {
        try {
          set({ loading: true });

          const { conversation, from, friend, requestId } =
            await friendServices.acceptFriend(id);
          useChatStore.getState().updateConversation(conversation);
          useChatStore.getState().setActiveConversation(conversation._id);
          useChatStore.getState().fetchMessages(conversation._id);

          if (from) {
            const { addFriend, setRequest } = get();
            addFriend(from);
            setRequest(requestId);

            const socket = useSocketStore.getState().socket;

            socket?.emit("friend:accept-request", {
              id: from._id,
              friend,
              requestId,
              conversation,
            });
          }
        } catch (error) {
          console.log(error);
        } finally {
          set({ loading: false });
        }
      },
      declineFriend: async (id) => {
        try {
          set({ loading: true });
          const { userId, requestId } = await friendServices.declineFriend(id);
          const { setRequest } = get();
          if (requestId) {
            setRequest(requestId);
            const socket = useSocketStore.getState().socket;

            socket?.emit("friend:decline-request", {
              userId,
              requestId,
            });
          }
        } catch (error) {
          console.log(error);
        } finally {
          set({ loading: false });
        }
      },
      cancelFriend: async (id) => {
        try {
          set({ loading: true });
          const { userId, requestId } = await friendServices.cancelFriend(id);
          const { setRequest } = get();
          if (requestId) {
            setRequest(requestId);
            const socket = useSocketStore.getState().socket;

            socket?.emit("friend:decline-request", {
              userId,
              requestId,
            });
          }
        } catch (error) {
          console.log(error);
        } finally {
          set({ loading: false });
        }
      },
      getAllFriend: async () => {
        try {
          set({ loading: true });
          const res = await friendServices.getAllFriend();

          set({ friends: res.friends });
        } catch (error) {
          console.log(error);
        } finally {
          set({ loading: false });
        }
      },
      deleteFriend: async (id) => {
        try {
          set({ loading: true });
          const { user, otherUser, conversation } =
            await friendServices.deleteFriend(id);
          if (conversation) {
            useChatStore.getState().removeConversation(conversation);
          }

          if (user && otherUser) {
            // update store
            const { removeFriend } = get();
            removeFriend(otherUser._id.toString());

            // bắn socket
            const socket = useSocketStore.getState().socket;
            socket?.emit("friend:delete-request", {
              user,
              id: otherUser._id,
              conversation,
            });
          }
        } catch (error) {
          console.log(error);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "friends-storage",
      partialize: (state) => ({
        friends: state.friends,
        requestTo: state.requestTo,
      }),
    }
  )
);
