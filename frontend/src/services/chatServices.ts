import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/typeChat";

interface IFetchMessage {
  mess: Message[];
  cursor?: string;
}
interface IsendDirectMess {
  recipientId: string;
  conversationId?: string;
  content: string;
  imgUrl?: string | null;
  replyTo?: string | null;
}

interface IsendGroupMess {
  conversationId?: string;
  content: string;
  imgUrl?: string | null;
  replyTo?: string | null;
}

interface ICreateConversation {
  type: string;

  memberIds: string[];
  name?: string;
}
const limit = 50;

export const chatServices = {
  // dùng khi signin để lấy conversation
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversation/all");
    return res.data;
  },
  // lấy tin nhắn cuộc hội thoại khi click
  async fetchMessage(id: string, cursor?: string): Promise<IFetchMessage> {
    const res = await api.get(
      `/conversation/${id}/message?limit=${limit}&cursor=${cursor}`
    );
    return { mess: res.data.message, cursor: res.data.nextCursor };
  },

  async sendDirectMess({
    recipientId,
    conversationId,
    content,
    imgUrl,
    replyTo,
  }: IsendDirectMess) {
    const res = await api.post("/message/direct", {
      recipientId,
      conversationId,
      content,
      imgUrl,
      replyTo,
    });
    return res.data;
  },
  async sendGroupMess({
    conversationId,
    content,
    imgUrl,
    replyTo,
  }: IsendGroupMess) {
    const res = await api.post("/message/group", {
      conversationId,
      content,
      imgUrl,
      replyTo,
    });
    return res.data;
  },
  async editMessage(messageId: string, content: string) {
    const res = await api.patch(`/message/${messageId}`, { content });
    return res.data;
  },
  async recallMessage(messageId: string) {
    const res = await api.post(`/message/${messageId}/recall`);
    return res.data;
  },
  async reactMessage(messageId: string, emoji: string) {
    const res = await api.post(`/message/${messageId}/reaction`, { emoji });
    return res.data;
  },
  createConversation: async ({
    type,
    memberIds,
    name,
  }: ICreateConversation) => {
    const res = await api.post(
      "/conversation/",
      { type, memberIds, name },
      { withCredentials: true }
    );
    return res.data;
  },
  addMembers: async (conversationId: string, memberIds: string[]) => {
    const res = await api.post(`/conversation/${conversationId}/members`, {
      memberIds,
    });
    return res.data;
  },
  removeMember: async (conversationId: string, userId: string) => {
    const res = await api.post(
      `/conversation/${conversationId}/members/${userId}/remove`
    );
    return res.data;
  },
  renameGroup: async (conversationId: string, name: string) => {
    const res = await api.post(`/conversation/${conversationId}/rename`, {
      name,
    });
    return res.data;
  },
  setAdmin: async (conversationId: string, userId: string, admin: boolean) => {
    const res = await api.post(
      `/conversation/${conversationId}/admins/${userId}`,
      { admin }
    );
    return res.data;
  },
  transferOwner: async (conversationId: string, userId: string) => {
    const res = await api.post(
      `/conversation/${conversationId}/transfer/${userId}`
    );
    return res.data;
  },
  setPersonal: async (
    conversationId: string,
    setting: "pin" | "mute",
    value: boolean
  ) => {
    const res = await api.post(
      `/conversation/${conversationId}/settings/${setting}`,
      { value }
    );
    return res.data;
  },
  searchMessages: async (
    conversationId: string,
    q: string
  ): Promise<{ messages: Message[] }> => {
    const res = await api.get(
      `/conversation/${conversationId}/search?q=${encodeURIComponent(q)}`
    );
    return res.data;
  },
  pinMessage: async (messageId: string, pinned: boolean) => {
    const res = await api.post(`/message/${messageId}/pin`, { pinned });
    return res.data;
  },
  deleteConversation: async (conversationId: string, type: string) => {
    const res = await api.post(
      `/conversation/${conversationId}/delete`,
      { type },
      { withCredentials: true }
    );
    return res.data;
  },
};
