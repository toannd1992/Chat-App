import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./typeChat";
import type { typeUser } from "./typeUser";

export interface typeStore {
  accessToken: string | null;
  user: typeUser | null;
  loading: boolean;

  clearState: () => void;

  signUpStore: (
    fistname: string,
    lastname: string,
    email: string,
    password: string
  ) => Promise<object>;

  signInStore: (email: string, password: string) => Promise<string>;
  signOutStore: () => Promise<void>;
  fetchMeStore: () => Promise<void>;
  refreshStore: () => Promise<void>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // xu ly thanh cuon scroll
      nextCursor?: string | null;
    }
  >;
  activeConversationId: string | null;
  loading: boolean;
  loadingMessage: boolean;
  reset: () => void;
  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessStore: (
    recipientId: string,
    content: string,
    conversationId?: string,
    imgUrl?: string
  ) => Promise<void>;
  sendGroupMessStore: (
    content: string,
    conversationId?: string,
    imgUrl?: string
  ) => Promise<void>;
  // add message
  addMessage: (message: Message) => Promise<void>;
  // update conversation
  updateConversation: (conversation: Conversation) => void;
}

export interface SocketState {
  socket: Socket | null;
  userOnline: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
  messagesAsSeen: (conversationId: string) => void;
}
