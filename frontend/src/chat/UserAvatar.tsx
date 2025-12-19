import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface IUserAvatar {
  type: "sidebar" | "chat" | "profile" | "group";
  name: string;
  avatarUrl?: string;
  className?: string;
  color?: string;
}

const UserAvatar = ({
  type,
  name,
  avatarUrl,
  className,
  color,
}: IUserAvatar) => {
  const bgColor = !avatarUrl && !color ? "bg-blue-500" : color;
  if (!name) {
    name = "OK";
  }

  return (
    <Avatar
      className={cn(
        className ?? "",
        type === "sidebar" && "size-12 text-base",
        type === "chat" && "size-8 text-sm",
        type === "group" && "size-6 text-sm",
        type === "profile" && "size-20 text-3xl shadow-md"
      )}
    >
      <AvatarImage src={avatarUrl || undefined} alt={name || "avartar"} />

      <AvatarFallback className={`${bgColor} text-white font-semibold`}>
        {name.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
