import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/typeChat";
import { useEffect, useRef, useState } from "react";

import { Button } from "../ui/button";
import { ImagePlus, Pencil, Reply, Send, X } from "lucide-react";
import Emoji from "./Emoji";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { toast } from "sonner";

const InputMessage = ({ conversation }: { conversation: Conversation }) => {
  const { user } = useAuthStore();
  const [value, setValue] = useState<string>("");

  const {
    loadingMessage,
    activeConversationId,
    sendDirectMessStore,
    sendGroupMessStore,
    replyingTo,
    editingMessage,
    setReplyingTo,
    setEditingMessage,
    editMessage,
  } = useChatStore();
  const emitTyping = useSocketStore((s) => s.emitTyping);
  const typingRef = useRef(false); // đã báo "đang nhập" chưa
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imgView, setImgView] = useState<string | null>(null); // tạo state để quản lý ảnh
  const inputRef = useRef<HTMLInputElement>(null);

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
  // báo cho người khác biết mình đang nhập, tự tắt sau 2 giây không gõ
  const stopTyping = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (typingRef.current) {
      typingRef.current = false;
      emitTyping(conversation._id, false);
    }
  };
  const notifyTyping = () => {
    if (!typingRef.current) {
      typingRef.current = true;
      emitTyping(conversation._id, true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2000);
  };
  // đổi hội thoại hoặc rời khỏi thì dừng
  useEffect(() => {
    return () => stopTyping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation._id]);

  // bấm "Sửa" thì đưa nội dung cũ vào ô nhập
  useEffect(() => {
    if (editingMessage) {
      setValue(editingMessage.content ?? "");
      inputMessage.current?.focus();
    }
  }, [editingMessage]);
  // trả lời thì đặt con trỏ vào ô nhập
  useEffect(() => {
    if (replyingTo) inputMessage.current?.focus();
  }, [replyingTo]);

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

    // đang sửa tin nhắn
    if (editingMessage) {
      const newText = value.trim();
      if (!newText) return;
      if (newText === editingMessage.content) {
        setEditingMessage(null);
        setValue("");
        return;
      }
      const done = await editMessage(editingMessage._id, newText);
      if (done) {
        setValue("");
      } else {
        toast.error("Sửa tin nhắn thất bại, vui lòng thử lại");
      }
      return;
    }

    if (!value.trim() && !imgView) return;
    stopTyping();

    // giữ lại nội dung để khôi phục nếu gửi lỗi
    const replyId = replyingTo?._id ?? null;
    const text = value;
    const image = imgView;
    setValue("");
    setImgView(null); // set ảnh về null
    let sent = false;
    try {
      if (conversation.type === "direct") {
        const recipient = conversation.participants.find(
          (p) => p?.userId?._id.toString() !== user._id.toString()
        );
        const targetUserId = recipient?.userId?._id;
        if (!targetUserId) {
          console.error("Không tìm thấy người nhận");
        } else {
          sent = await sendDirectMessStore(
            targetUserId,
            text,
            image ?? undefined,
            replyId
          );
        }
      } else {
        sent = await sendGroupMessStore(text, conversation._id, image, replyId);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (!sent) {
        // gửi lỗi thì trả lại nội dung để người dùng không phải gõ lại
        setValue(text);
        setImgView(image);
        toast.error("Gửi tin nhắn thất bại, vui lòng thử lại");
      }
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
  const cancelEditOrReply = () => {
    if (editingMessage) setValue("");
    setEditingMessage(null);
    setReplyingTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && (editingMessage || replyingTo)) {
      cancelEditOrReply();
      return;
    }
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
      {/* đang trả lời / đang sửa */}
      {(replyingTo || editingMessage) && (
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs">
          {editingMessage ? (
            <Pencil size={14} className="shrink-0" />
          ) : (
            <Reply size={14} className="shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">
              {editingMessage
                ? "Đang sửa tin nhắn"
                : `Trả lời ${replyingTo?.senderId?.displayName ?? ""}`}
            </p>
            {replyingTo && (
              <p className="truncate text-muted-foreground">
                {replyingTo.content ||
                  (replyingTo.imgUrl ? "[Hình ảnh]" : "")}
              </p>
            )}
          </div>
          <button
            type="button"
            title="Hủy"
            onClick={cancelEditOrReply}
            className="cursor-pointer rounded-full p-0.5 hover:bg-background"
          >
            <X size={16} />
          </button>
        </div>
      )}
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
          onChange={(e) => {
            setValue(e.target.value);
            if (e.target.value && !editingMessage) notifyTyping();
            else stopTyping();
          }}
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
