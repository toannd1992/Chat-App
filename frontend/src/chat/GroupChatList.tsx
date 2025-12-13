import { useChatStore } from "@/stores/useChatStore";
import GroupCard from "./GroupCard";

const GroupChatList = () => {
  const { conversations } = useChatStore();
  if (!conversations) return null;
  const group = conversations.filter((item) => item.type === "group");
  return (
    <div className="flex-1 overflow-y-auto  p-2 space-y-2">
      {group.map((convo) => (
        <GroupCard key={convo._id} convo={convo} />
      ))}
    </div>
  );
};

export default GroupChatList;
