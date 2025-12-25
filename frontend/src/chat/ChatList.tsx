import { useChatStore } from "@/stores/useChatStore";
import ChatCard from "./ChatCard";
import { getInfo } from "../lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnReadCountBadge from "./UnReadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import GroupAvatar from "./GroupAvatar";
import { useSidebar } from "@/components/ui/sidebar";

const ChatList = () => {
  const {
    conversations,
    setActiveConversation,
    activeConversationId,
    messages,
    fetchMessages,
  } = useChatStore();
  const { user } = useAuthStore();
  const { userOnline, messagesAsSeen } = useSocketStore();
  const { isMobile, setOpenMobile } = useSidebar();

  if (!conversations || !user) return null;

  const handleSelect = async (id: string) => {
    setActiveConversation(id);
    if (messagesAsSeen) {
      // Check null
      messagesAsSeen(id);
    }
    if (isMobile) {
      setOpenMobile(false);
    }
    if (!messages[id]) {
      await fetchMessages(id); // lay tin nham khi lick vao hoi thoai
    }
  };

  return (
    <div className="flex-1 overflow-y-auto  p-2 space-y-2">
      {conversations.map((convo) => {
        // gọi làm lấy thông tin từ conversation ở until
        const info = getInfo(convo, user, activeConversationId);

        return (
          <ChatCard
            key={convo._id}
            convoId={convo._id}
            name={info.name}
            unreadCount={info.unreadCount}
            timestamp={info.timestamp}
            subtitle={info.subtitle}
            isActive={activeConversationId === convo._id}
            onSelect={handleSelect}
            leftSection={
              convo.type === "direct" ? (
                <>
                  <UserAvatar
                    type="sidebar"
                    name={info.name}
                    avatarUrl={info.avatarUrl ?? undefined}
                  />
                  <StatusBadge
                    status={
                      userOnline.includes(info.otherUser?.userId?._id ?? "")
                        ? "online"
                        : "offline"
                    }
                  />
                  <UnReadCountBadge unreadCount={info.unreadCount} />
                </>
              ) : (
                <>
                  <GroupAvatar participants={convo.participants} type="group" />
                  <UnReadCountBadge unreadCount={info.unreadCount} />
                </>
              )
            }
            sender={info.sender}
          />
        );
      })}
    </div>
  );
};

export default ChatList;
