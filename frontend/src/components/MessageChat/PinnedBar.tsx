import { useState } from "react";
import { ChevronDown, ChevronUp, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/utils";
import { chatServices } from "@/services/chatServices";
import type { Conversation, PinnedMessage } from "@/types/typeChat";

const previewOf = (m: PinnedMessage) =>
  m.content || (m.imgUrl ? "[Hình ảnh]" : "");

// thanh hiển thị các tin nhắn đã ghim ở đầu cuộc trò chuyện
const PinnedBar = ({ convo }: { convo: Conversation }) => {
  const [expanded, setExpanded] = useState(false);
  // populate có thể trả null nếu tin đã bị xóa khỏi DB
  const pinned = (convo.pinnedMessages ?? []).filter(Boolean);
  if (pinned.length === 0) return null;

  const latest = pinned[pinned.length - 1];
  const list = expanded ? [...pinned].reverse() : [latest];

  const unpin = async (id: string) => {
    try {
      await chatServices.pinMessage(id, false);
    } catch (error) {
      toast.error(apiError(error, "Bỏ ghim thất bại"));
    }
  };

  return (
    <div className="shrink-0 border-b bg-muted/50 px-4 py-1.5 text-xs">
      {list.map((m) => (
        <div key={m._id} className="flex items-center gap-2 py-0.5">
          <Pin size={14} className="shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold">
              {m.senderId?.displayName ?? ""}:{" "}
            </span>
            <span className="text-muted-foreground">{previewOf(m)}</span>
          </div>
          <button
            type="button"
            title="Bỏ ghim"
            onClick={() => unpin(m._id)}
            className="cursor-pointer rounded-full p-1 hover:bg-background"
          >
            <PinOff size={14} />
          </button>
        </div>
      ))}
      {pinned.length > 1 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex cursor-pointer items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Thu gọn" : `Xem ${pinned.length} tin đã ghim`}
        </button>
      )}
    </div>
  );
};

export default PinnedBar;
