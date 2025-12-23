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
}

interface IsendGroupMess {
  conversationId?: string;
  content: string;
  imgUrl?: string | null;
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
  }: IsendDirectMess) {
    const res = await api.post("/message/direct", {
      recipientId,
      conversationId,
      content,
      imgUrl,
    });
    return res.data;
  },
  async sendGroupMess({ conversationId, content, imgUrl }: IsendGroupMess) {
    const res = await api.post("/message/group", {
      conversationId,
      content,
      imgUrl,
    });
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
  deleteConversation: async (conversationId: string, type: string) => {
    const res = await api.post(
      `/conversation/${conversationId}/delete`,
      { type },
      { withCredentials: true }
    );
    return res.data;
  },
};
