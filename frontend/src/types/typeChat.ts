export interface UserInfo {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
  email?: string;
}

export interface Participant {
  _id: string;
  joinedAt: string;
  userId?: UserInfo;
}

export interface Group {
  name: string;
  createdBy: string;
  admins?: string[]; // phó nhóm
}

// tin nhắn được ghim trong hội thoại
export interface PinnedMessage {
  _id: string;
  content: string | null;
  imgUrl?: string | null;
  attachments?: Attachment[];
  deletedAt?: string | null;
  senderId?: { _id: string; displayName: string } | null;
}

export interface LastMessage {
  _id: string;
  content: string;
  createdAt: string;
  senderId: UserInfo;
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group?: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: string[]; //SeenUser[]
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  pinnedBy?: string[]; // những người đã ghim hội thoại
  mutedBy?: string[]; // những người đã tắt thông báo
  pinnedMessages?: PinnedMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

// ảnh / tệp / tin nhắn thoại đính kèm
export interface Attachment {
  kind: "image" | "file" | "audio";
  url: string;
  name: string;
  size: number;
  mime: string;
  duration?: number;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

// tin nhắn được trích dẫn khi reply
export interface ReplyPreview {
  _id: string;
  content: string | null;
  imgUrl?: string | null;
  attachments?: Attachment[];
  deletedAt?: string | null;
  senderId?: { _id: string; displayName: string } | null;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: UserInfo;
  content: string | null;
  imgUrl?: string | null;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
  attachments?: Attachment[];
  replyTo?: ReplyPreview | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  reactions?: MessageReaction[];
}
