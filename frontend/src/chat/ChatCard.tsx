import { Card } from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { Image } from "lucide-react";

interface ChatCardProps {
  convoId: string;
  name: string;
  timestamp?: Date;
  isActive: boolean;
  onSelect: (id: string) => void;
  unreadCount?: number;
  leftSection: React.ReactNode;
  subtitle: React.ReactNode;
  sender?: string | null;
}

const ChatCard = ({
  convoId,
  name,
  timestamp,
  isActive,
  onSelect,
  unreadCount,
  leftSection,
  subtitle,
  sender,
}: ChatCardProps) => {
  return (
    <Card
      key={convoId}
      className={cn(
        "border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted",
        isActive && "ring-2 ring-primary/80"
      )}
      onClick={() => {
        onSelect(convoId);
      }}
    >
      <div className="flex items-center gap-2">
        {/* avatar */}
        <div className="relative">{leftSection}</div>
        {/* name va h */}
        <div className="flex-1 min-w-0 ">
          <div className="flex justify-between">
            <h3
              className={cn(
                "font-semibold text-sm truncate",
                unreadCount && unreadCount > 0 && "text-foreground"
              )}
            >
              {name}
            </h3>
            <span className="text-xs text-muted-foreground">
              {timestamp ? formatOnlineTime(timestamp) : ""}
            </span>
          </div>
          <div className="flex gap-2 ">
            {sender && <div className="">{`${sender}`}</div>}

            <div className="truncate flex gap-1 items-center ">
              {subtitle === "Hình ảnh" && (
                <Image className="size-4 flex text-muted-foreground" />
              )}
              {subtitle}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatCard;
