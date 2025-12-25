import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/typeChat";
import { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ImagePlus, Send, X } from "lucide-react";
import Emoji from "./Emoji";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";

const InputMessage = ({ conversation }: { conversation: Conversation }) => {
  const { user } = useAuthStore();
  const [value, setValue] = useState<string>("");

  const {
    loadingMessage,
    activeConversationId,
    sendDirectMessStore,
    sendGroupMessStore,
  } = useChatStore();
  const [imgView, setImgView] = useState<string | null>(null); // tạo state để quản lý ảnh
  const inputRef = useRef<HTMLInputElement>(null);
  // const inputMessage = useRef<HTMLInputElement>(null);
  const inputMessage = useRef<HTMLTextAreaElement>(null);

  // Hàm tự động chỉnh chiều cao textarea
  const adjustHeight = () => {
    const el = inputMessage.current;
    if (el) {
      el.style.height = "auto"; // Reset về auto để tính toán lại từ đầu (tránh bị kẹt chiều cao cũ)
      el.style.height = `${Math.min(el.scrollHeight, 150)}px`; // Set chiều cao mới (Max 150px thì scroll)
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputMessage.current) {
        setValue("");
        inputMessage.current.style.height = "auto";
        inputMessage.current?.focus({ preventScroll: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeConversationId]);
  // mỗi khi value thay đổi chỉnh lại chiều cao
  useEffect(() => {
    adjustHeight();
  }, [value]);

  if (!user) return;

  let name;
  if (conversation.type === "direct") {
    name = conversation.participants.find(
      (item) => item?.userId?._id?.toString() !== user?._id.toString()
    )?.userId?.displayName;
  } else {
    name = conversation.group?.name;
  }
  // send tin nhắn
  const handleMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loadingMessage) return;
    if (!value.trim() && !imgView) return;
    try {
      if (conversation.type === "direct") {
        const recipient = conversation.participants.find(
          (p) => p?.userId?._id.toString() !== user._id.toString()
        );
        const targetUserId = recipient?.userId?._id;
        if (!targetUserId) {
          console.error("Không tìm thấy người nhận");
          return;
        }
        await sendDirectMessStore(targetUserId, value, imgView ?? undefined);
      } else {
        await sendGroupMessStore(value, conversation._id, imgView);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn");
    } finally {
      setValue("");
      setImgView(null); // set ảnh về null
      if (inputRef.current) inputRef.current.value = ""; // xet value = rỗng
      setTimeout(() => {
        inputMessage.current?.focus();
      }, 10);
    }
  };
  // chuyển đổi ảnh
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chỉ chọn file ảnh!");
      return;
    }
    // chuyển đổi ảnh = FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      setImgView(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  // xóa ảnh
  const removeImg = () => {
    setImgView(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  //
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      // nhấn Shift + Enter xuống dòng
      if (e.shiftKey) {
        return;
      }
      // nhấn enter gửi tin nhắn
      e.preventDefault();
      if (loadingMessage) return;
      handleMessage();
    }
  };
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* hiện ảnh */}
      {imgView && (
        <div className="relative w-20 h-20 p-3">
          <img
            src={imgView}
            alt="imgview"
            className="w-full h-full object-cover rounded-lg border border-border "
          />
          <button
            onClick={removeImg}
            className="cursor-pointer absolute -top-0.5 -right-0.5 bg-slate-500/30 rounded-full p-0.5 hover:bg-slate-700/30"
          >
            <X size={20} />
          </button>
        </div>
      )}
      {/*  Input */}
      <div className="flex gap-1 items-end">
        <input
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={handleImage}
        />

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 size-4 "
        >
          <Emoji onChange={(emoji) => setValue(`${value}${emoji}`)} />
        </Button>
        {/* emoji */}

        <textarea
          id="message-input"
          name="message"
          aria-label="Nhập tin nhắn"
          autoComplete="off"
          ref={inputMessage}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Nhập @, tin nhắn tới ${name}`}
          rows={1}
          className="
                    flex w-full rounded-md bg-transparent px-3 py-1.5 text-sm 
                    placeholder:text-muted-foreground focus-visible:outline-none 
                    disabled:cursor-not-allowed disabled:opacity-50 
                    resize-none overflow-y-auto min-h-[36px] max-h-[150px]
                    transition-all duration-200 beautiful-scrollbar
                "
        />
        {!value ? (
          <Button
            asChild
            variant="completedGhost"
            size="icon"
            className="size-4 hover:bg-primary/10 transition-smooth cursor-pointer"
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            <ImagePlus className="size-5 mb-2.5" />
          </Button>
        ) : (
          <Button
            onMouseDown={(e) => {
              e.preventDefault();
              handleMessage();
            }}
            className="hover:scale-105 cursor-pointer transition-smooth bg-gradient-chat h-8 mb-1"
            disabled={(!value.trim() && !imgView) || loadingMessage}
          >
            <Send className="text-white " />
          </Button>
        )}
      </div>
    </div>
  );
};

export default InputMessage;
