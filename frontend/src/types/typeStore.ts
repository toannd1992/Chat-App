import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./typeChat";
import type { FriendRequest, typeUser } from "./typeUser";

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
  updateAvatar: (avatar: string) => Promise<void>;
  updateProfile: (data: {
    displayName: string;
    phone: string;
    birthday: string;
    gender: string;
  }) => Promise<void>;
  seachUser: (keyword: string) => Promise<typeUser>;
  signOutStore: () => Promise<void>;
  fetchMeStore: () => Promise<void>;
  refreshStore: () => Promise<void>;
}

export interface FriendState {
  requestFrom: FriendRequest[];
  requestTo: FriendRequest[];
  friends: typeUser[];
  loading: boolean;
  sendFriend: (recipientId: string, message: string) => Promise<void>;
  getFriendRequests: () => Promise<void>;
  acceptFriend: (id: string) => Promise<void>;
  declineFriend: (id: string) => Promise<void>;
  setRequest: (id: string) => void;
  cancelFriend: (id: string) => Promise<void>;
  getAllFriend: () => Promise<void>;
}

export interface ThemeState {
  isOpenProfile: boolean;
  isOpenAddFriend: boolean;
  isOpenCreateGroup: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
  setProfile: (isOpen: boolean) => void;
  setAddFriend: (isOpen: boolean) => void;
  setCreateGroup: (isOpen: boolean) => void;
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
    imgUrl?: string | null
  ) => Promise<void>;
  sendGroupMessStore: (
    content: string,
    conversationId?: string,
    imgUrl?: string | null
  ) => Promise<void>;
  // add message
  addMessage: (message: Message) => Promise<void>;
  // update conversation
  updateConversation: (conversation: Conversation) => void;
  createGroup: (
    type: string,
    name: string,
    memberIds: string[]
  ) => Promise<void>;
}

export interface SocketState {
  socket: Socket | null;
  userOnline: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
  messagesAsSeen: (conversationId: string) => void;
}
