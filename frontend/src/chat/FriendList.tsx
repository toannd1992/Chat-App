import { useChatStore } from "@/stores/useChatStore";
import DirectCard from "./DirectCard";

const FriendList = () => {
  const { conversations } = useChatStore();

  if (!conversations) return null;
  const direct = conversations.filter((item) => item.type === "direct");

  return (
    <div className="flex-1 overflow-y-auto  p-2 space-y-2">
      {direct.map((convo) => (
        <DirectCard key={convo._id} convo={convo} />
      ))}
    </div>
  );
};

export default FriendList;
