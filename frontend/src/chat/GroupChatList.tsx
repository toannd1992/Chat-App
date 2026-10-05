import { useChatStore } from "@/stores/useChatStore";
import GroupCard from "./GroupCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { sortConversations } from "@/lib/utils";

const GroupChatList = () => {
  const { conversations } = useChatStore();
  const { user } = useAuthStore();
  if (!conversations) return null;
  const group = sortConversations(
    conversations.filter((item) => item.type === "group"),
    user?._id
  );
  return (
    <div className="flex-1 overflow-y-auto  p-2 space-y-2">
      {group.map((convo) => (
        <GroupCard key={convo._id} convo={convo} />
      ))}
    </div>
  );
};

export default GroupChatList;
