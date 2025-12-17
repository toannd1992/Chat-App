import { friendServices } from "@/services/friendServices";
import type { FriendState } from "@/types/typeStore";
import { create } from "zustand";

export const useFriendStore = create<FriendState>((set, get) => ({
  requestFrom: [],
  requestTo: [],
  friends: [],
  loading: false,
  setRequest: (id) =>
    set((state) => ({
      requestTo: state.requestTo.filter((item) => item._id !== id),
      requestFrom: state.requestFrom.filter((item) => item._id !== id),
    })),
  sendFriend: async (recipientId, message) => {
    try {
      const res = await friendServices.sendFriend(recipientId, message);
      set((state) => ({
        requestFrom: [...state.requestFrom, res.request],
      }));
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
      await friendServices.acceptFriend(id);
    } catch (error) {
      console.log(error);
    } finally {
      set({ loading: false });
    }
  },
  declineFriend: async (id) => {
    try {
      set({ loading: true });
      await friendServices.declineFriend(id);
    } catch (error) {
      console.log(error);
    } finally {
      set({ loading: false });
    }
  },
  cancelFriend: async (id) => {
    try {
      set({ loading: true });
      await friendServices.cancelFriend(id);
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
}));
