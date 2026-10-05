import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/typeChat";
import { useEffect, useRef, useState } from "react";

import { Button } from "../ui/button";
import {
  FileText,
  Mic,
  Paperclip,
  Pencil,
  Reply,
  Send,
  Square,
  X,
} from "lucide-react";
import Emoji from "./Emoji";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { toast } from "sonner";
import {
  ACCEPT_FILES,
  MAX_ATTACHMENTS,
  MAX_TOTAL_BYTES,
  formatDuration,
  formatSize,
  prepareFile,
  prepareVoice,
  previewOfMessage,
  type OutgoingAttachment,
} from "@/lib/attachments";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

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
  // ảnh, tệp, tin nhắn thoại đang chờ gửi
  const [attachments, setAttachments] = useState<OutgoingAttachment[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputMessage = useRef<HTMLTextAreaElement>(null);

  // thêm tin nhắn thoại vừa ghi xong vào danh sách chờ gửi
  const voice = useVoiceRecorder(async (blob, duration) => {
    try {
      const att = await prepareVoice(blob, duration);
      setAttachments((prev) => [...prev, att]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ghi âm thất bại");
    }
  });

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
        setAttachments([]);
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
    if (loadingMessage || voice.recording) return;

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

    if (!value.trim() && attachments.length === 0) return;
    stopTyping();

    // giữ lại nội dung để khôi phục nếu gửi lỗi
    const replyId = replyingTo?._id ?? null;
    const text = value;
    const files = attachments;
    setValue("");
    setAttachments([]);
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
          sent = await sendDirectMessStore(targetUserId, text, files, replyId);
        }
      } else {
        sent = await sendGroupMessStore(text, conversation._id, files, replyId);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (!sent) {
        // gửi lỗi thì trả lại nội dung để người dùng không phải gõ lại
        setValue(text);
        setAttachments(files);
        toast.error("Gửi tin nhắn thất bại, vui lòng thử lại");
      }
      setTimeout(() => {
        inputMessage.current?.focus();
      }, 10);
    }
  };

  // chọn ảnh / tệp
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // cho phép chọn lại cùng tệp
    if (picked.length === 0) return;
    if (attachments.length + picked.length > MAX_ATTACHMENTS) {
      toast.error(`Chỉ gửi được tối đa ${MAX_ATTACHMENTS} tệp mỗi tin nhắn`);
      return;
    }
    const prepared: OutgoingAttachment[] = [];
    for (const file of picked) {
      try {
        prepared.push(await prepareFile(file));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Tệp không hợp lệ");
      }
    }
    if (prepared.length === 0) return;
    const total = [...attachments, ...prepared].reduce((s, a) => s + a.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      toast.error("Tổng dung lượng tối đa 8MB mỗi tin nhắn");
      return;
    }
    setAttachments((prev) => [...prev, ...prepared]);
  };
  const removeAttachment = (id: string) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  // bắt đầu ghi âm
  const startRecording = async () => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      toast.error(`Chỉ gửi được tối đa ${MAX_ATTACHMENTS} tệp mỗi tin nhắn`);
      return;
    }
    try {
      await voice.start();
    } catch (error) {
      const unsupported =
        error instanceof Error && error.message === "unsupported";
      toast.error(
        unsupported
          ? "Trình duyệt không hỗ trợ ghi âm"
          : "Không thể truy cập micro, hãy cho phép quyền ghi âm"
      );
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

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !loadingMessage;

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
                {previewOfMessage(replyingTo)}
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

      {/* ảnh, tệp, tin nhắn thoại đang chờ gửi */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachments.map((a) => (
            <div key={a.id} className="relative">
              {a.kind === "image" ? (
                <img
                  src={a.dataUrl}
                  alt={a.name}
                  className="h-16 w-16 rounded-lg border border-border object-cover"
                />
              ) : a.kind === "audio" ? (
                <div className="flex h-16 flex-col justify-center rounded-lg border px-2">
                  <audio controls src={a.dataUrl} className="h-8 w-48" />
                  {a.duration ? (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDuration(a.duration)}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-16 w-44 items-center gap-2 rounded-lg border px-2">
                  <FileText className="size-7 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatSize(a.size)}
                    </p>
                  </div>
                </div>
              )}
              <button
                type="button"
                title="Bỏ tệp này"
                onClick={() => removeAttachment(a.id)}
                className="cursor-pointer absolute -top-1.5 -right-1.5 rounded-full bg-slate-500/60 p-0.5 text-white hover:bg-slate-700"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* đang ghi âm */}
      {voice.recording ? (
        <div className="flex items-center gap-3 rounded-md bg-muted px-3 py-2">
          <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="flex-1 text-sm">
            Đang ghi âm... {formatDuration(voice.seconds)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={voice.cancel}
          >
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            className="cursor-pointer gap-1"
            onClick={voice.stop}
          >
            <Square className="size-3" /> Dừng
          </Button>
        </div>
      ) : (
        /*  Input */
        <div className="flex gap-1 items-end">
          <input
            type="file"
            className="hidden"
            ref={inputRef}
            accept={ACCEPT_FILES}
            multiple
            onChange={handleFiles}
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
          {!editingMessage && (
            <>
              <button
                type="button"
                title="Đính kèm ảnh hoặc tệp"
                onClick={() => inputRef.current?.click()}
                className="mb-2 cursor-pointer rounded p-0.5 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              >
                <Paperclip className="size-5" />
              </button>
              {!canSend && (
                <button
                  type="button"
                  title="Ghi âm"
                  onClick={startRecording}
                  className="mb-2 cursor-pointer rounded p-0.5 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                >
                  <Mic className="size-5" />
                </button>
              )}
            </>
          )}
          {(canSend || editingMessage) && (
            <Button
              onMouseDown={(e) => {
                e.preventDefault();
                handleMessage();
              }}
              className="hover:scale-105 cursor-pointer transition-smooth bg-gradient-chat h-8 mb-1"
              disabled={!canSend}
            >
              <Send className="text-white " />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default InputMessage;
