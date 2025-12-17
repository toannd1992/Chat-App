import api from "@/lib/axios";

export const friendServices = {
  sendFriend: async (to: string, message: string) => {
    const res = await api.post(
      "/friend/request",
      { to, message },
      { withCredentials: true }
    );
    return res.data;
  },
  getFriendRequests: async () => {
    const res = await api.get("friend/requests", { withCredentials: true });
    return res.data;
  },
  acceptFriend: async (id: string) => {
    const res = await api.post(`friend/requests/${id}/accept`, {
      withCredentials: true,
    });
    return res.data;
  },
  declineFriend: async (id: string) => {
    const res = await api.post(`friend/requests/${id}/decline`, {
      withCredentials: true,
    });
    return res.data;
  },
  cancelFriend: async (id: string) => {
    const res = await api.post(`friend/requests/${id}/cancel`, {
      withCredentials: true,
    });
    return res.data;
  },
  getAllFriend: async () => {
    const res = await api.get("friend/all", { withCredentials: true });
    return res.data;
  },
};
