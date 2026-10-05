import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatMessageTime } from "@/lib/utils";
import { chatServices } from "@/services/chatServices";
import type { Message } from "@/types/typeChat";

interface Props {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}

// tô đậm từ khóa trong kết quả
const Highlight = ({ text, keyword }: { text: string; keyword: string }) => {
  const lower = text.toLowerCase();
  const index = lower.indexOf(keyword.toLowerCase());
  if (index < 0 || !keyword) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-500/40">
        {text.slice(index, index + keyword.length)}
      </mark>
      {text.slice(index + keyword.length)}
    </>
  );
};

const SearchMessagesModal = ({ conversationId, isOpen, onClose }: Props) => {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // đóng hoặc đổi hội thoại thì xóa kết quả cũ
  useEffect(() => {
    setValue("");
    setResults([]);
    setSearched(false);
  }, [conversationId, isOpen]);

  // gõ xong 400ms mới tìm để không gọi server liên tục
  useEffect(() => {
    const keyword = value.trim();
    if (!keyword) {
      setResults([]);
      setSearched(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await chatServices.searchMessages(conversationId, keyword);
        if (!cancelled) {
          setResults(res.messages);
          setSearched(true);
        }
      } catch (error) {
        console.error("Lỗi khi tìm tin nhắn", error);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, conversationId]);

  const keyword = value.trim();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Tìm tin nhắn</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            autoFocus
            value={value}
            maxLength={100}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nhập từ khóa..."
            className="rounded pl-8"
          />
        </div>
        <div className="h-72 overflow-y-auto rounded border p-2">
          {loading ? (
            <div className="flex justify-center p-6">
              <Spinner className="size-5" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((m) => (
                <div key={m._id} className="rounded border p-2 text-sm">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span className="font-semibold">
                      {m.senderId?.displayName}
                    </span>
                    <span>{formatMessageTime(new Date(m.createdAt))}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">
                    <Highlight text={m.content ?? ""} keyword={keyword} />
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {searched ? "Không tìm thấy kết quả" : "Nhập từ khóa để tìm"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchMessagesModal;
