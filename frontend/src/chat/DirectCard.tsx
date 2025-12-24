import type { Conversation } from "@/types/typeChat";
import ChatCard from "./ChatCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnReadCountBadge from "./UnReadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import { useSidebar } from "@/components/ui/sidebar";

const DirectCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { userOnline, messagesAsSeen } = useSocketStore();
  const { isMobile, setOpenMobile } = useSidebar();
  const {
    activeConversationId,
    setActiveConversation,
    messages,
    fetchMessages,
  } = useChatStore();
  if (!user) return null;
  const otherUser = convo.participants.find(
    (item) => item?.userId?._id !== user._id
  );
  if (!otherUser) return null;

  const unreadCount =
    convo._id.toString() === activeConversationId
      ? 0
      : convo.unreadCounts[user._id];
  const name = otherUser.userId?.displayName ?? "";
  const subtitle = convo.lastMessage?.content ?? "";
  const timestamp = convo.lastMessage?.createdAt
    ? new Date(convo.lastMessage.createdAt)
    : undefined;
  const handleSelect = async (id: string) => {
    //set active khi click vào hội thoại
    setActiveConversation(id);
    // gọi hàm báo đã xem
    if (messagesAsSeen) {
      // Check null
      messagesAsSeen(id);
    }
    if (activeConversationId === id && isMobile) {
      setOpenMobile(false);
    }
    if (!messages[id]) {
      await fetchMessages(id); // lay tin nham khi lick vao hoi thoai
    }
  };
  const userSend = "Hãy bắt đầu trò chuyện!";
  const isMe =
    convo.lastMessage?.senderId._id.toString() === user._id.toString();
  const sender = !convo.lastMessage ? userSend : isMe ? "Bạn:" : "";

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
          <UserAvatar
            type="sidebar"
            name={name}
            avatarUrl={otherUser.userId?.avatarUrl ?? undefined}
          />
          <StatusBadge
            status={
              userOnline.includes(otherUser?.userId?._id ?? "")
                ? "online"
                : "offline"
            }
          />
          <UnReadCountBadge unreadCount={unreadCount} />
        </>
      }
      sender={sender}
    />
  );
};

export default DirectCard;
