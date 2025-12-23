import { Badge } from "@/components/ui/badge";

const UnReadCountBadge = ({ unreadCount }: { unreadCount: number }) => {
  return (
    <div className="pulse-ring absolute z-20 -top-3 -right-3">
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default UnReadCountBadge;
