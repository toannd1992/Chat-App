import GroupAvatar from "@/chat/GroupAvatar";
import StatusBadge from "@/chat/StatusBadge";
import UserAvatar from "@/chat/UserAvatar";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";

const HeaderMessage = () => {
  const { user } = useAuthStore();
  const { userOnline } = useSocketStore();

  const { conversations, activeConversationId } = useChatStore();
  const convo = conversations.find((item) => item._id === activeConversationId);
  if (!convo) return null;
  if (!user) return null;
  let name;
  let avatar;
  let otherUser;
  if (convo.type === "direct") {
    otherUser = convo?.participants.find(
      (item) => item.userId?._id !== user._id
    );
    name = otherUser?.userId?.displayName ?? "";
    if (!name) return null;
    avatar = otherUser?.userId?.avatarUrl ?? "";
  } else {
    name = convo.group?.name ?? "";
  }

  return (
    <div className="flex gap-3 items-center">
      {convo.type === "direct" ? (
        <div className=" relative">
          <UserAvatar type="sidebar" name={name} avatarUrl={avatar} />
          <StatusBadge
            status={
              otherUser?.userId?._id &&
              userOnline.includes(otherUser?.userId?._id)
                ? "online"
                : "offline"
            }
          />
        </div>
      ) : (
        <GroupAvatar type="group" participants={convo.participants} />
      )}
      <h2 className="font-semibold text-xm">{name}</h2>
    </div>
  );
};

export default HeaderMessage;
