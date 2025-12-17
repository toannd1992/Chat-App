import type { Participant } from "@/types/typeChat";
import UserAvatar from "./UserAvatar";

interface GroupAvatarProps {
  participants: Participant[];
  type: "chat" | "sidebar" | "group";
}

const GroupAvatar = ({ participants, type }: GroupAvatarProps) => {
  const avatars = [];
  const limit = Math.min(participants.length, 3);

  for (let i = 0; i < limit; i++) {
    const member = participants[i];
    avatars.push(
      <UserAvatar
        key={i}
        type={type}
        name={member.userId?.displayName ?? ""}
        avatarUrl={member.userId?.avatarUrl ?? undefined}
      />
    );
  }
  avatars.push(
    <UserAvatar
      key={avatars.length + 1}
      type={type}
      name={participants.length.toString()}
      avatarUrl={undefined}
      color="bg-gray-300"
    />
  );
  return (
    <div className="relative grid grid-cols-2  *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:ring-2">
      {avatars}
    </div>
  );
};

export default GroupAvatar;
