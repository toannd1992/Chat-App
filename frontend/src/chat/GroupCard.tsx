import type { Conversation } from "@/types/typeChat";
import ChatCard from "./ChatCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import GroupAvatar from "./GroupAvatar";
import UnReadCountBadge from "./UnReadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";

const GroupCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { messagesAsSeen } = useSocketStore();
  const {
    activeConversationId,
    setActiveConversation,
    messages,
    fetchMessages,
  } = useChatStore();
  if (!user) return null;
  const otherUser = convo.participants.find((item) => item._id !== user._id);
  if (!otherUser) return null;
  const unreadCount =
    convo._id.toString() === activeConversationId
      ? 0
      : convo.unreadCounts[user._id];
  const name = convo.group?.name;
  const subtitle = convo.lastMessage?.content ?? "";
  const timestamp = convo.lastMessage?.createdAt
    ? new Date(convo.lastMessage.createdAt)
    : undefined;
  const handleSelect = async (id: string) => {
    setActiveConversation(id);
    if (messagesAsSeen) {
      // Check null
      messagesAsSeen(id);
    }
    if (!messages[id]) {
      await fetchMessages(id); // lay tin nham khi lick vao hoi thoai
    }
  };

  const senderId = convo.lastMessage?.senderId._id;
  const sender =
    senderId?.toString() === user?._id?.toString()
      ? "Bạn"
      : convo.lastMessage?.senderId.displayName;

  return (
    <ChatCard
      convoId={convo._id}
      name={name}
      unreadCount={unreadCount}
      timestamp={timestamp}
      subtitle={subtitle}
      isActive={activeConversationId === convo._id}
      onSelect={handleSelect}
      leftSection={
        <>
          <GroupAvatar participants={convo.participants} type="group" />
          <UnReadCountBadge unreadCount={unreadCount} />
        </>
      }
      sender={`${sender}:`}
    />
  );
};

export default GroupCard;
