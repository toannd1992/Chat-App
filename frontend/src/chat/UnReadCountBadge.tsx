import { Badge } from "@/components/ui/badge";

const UnReadCountBadge = ({ unreadCount }: { unreadCount: number }) => {
  return (
    <div className="pulse-ring absolute z-20 -top-3 -right-3">
      {unreadCount > 0 && (
        <Badge className="text-white size-5 text-xs bg-gradient-chat border-none border-background">
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default UnReadCountBadge;
