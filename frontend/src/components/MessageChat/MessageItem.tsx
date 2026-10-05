import { useState } from "react";
import { Pencil, Reply, Smile, Undo2 } from "lucide-react";
import UserAvatar from "@/chat/UserAvatar";
import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message } from "@/types/typeChat";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

interface IMessage {
  message: Message;
  index: number;
  messages: Message[];
  convo: Conversation;
  lastMessageStatus?: boolean;
}

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
const RECALLED_TEXT = "Tin nhắn đã được thu hồi";

const MessageItem = ({
  message,
  index,
  messages,
  convo,
  lastMessageStatus,
}: IMessage) => {
  const { user } = useAuthStore();
  const { setReplyingTo, setEditingMessage, recallMessage, reactMessage } =
    useChatStore();
  const [showActions, setShowActions] = useState(false); // bấm vào tin để hiện thanh công cụ (cảm ứng)
  const [pickerOpen, setPickerOpen] = useState(false);

  // hàm lấy id chuẩn

  const getSenderId = (msg?: Message): string | null => {
    if (!msg || !msg.senderId) return null;

    // Lấy _id bên trong
    if (typeof msg.senderId === "object" && "_id" in msg.senderId) {
      // Ép kiểu an toàn thay vì dùng 'any'
      return (msg.senderId as { _id: string | number })._id.toString();
    }

    // return chính nó kiểu string
    return String(msg.senderId);
  };

  const currentId = getSenderId(message);
  const prevId = getSenderId(messages[index - 1]);
  const nextId = getSenderId(messages[index + 1]);

  // group là tin đầu tiên hoặc người gửi khác tin trước
  const isGroup = index === 0 || currentId !== prevId;
  // tin sau là của người khác là true
  const timed = nextId !== currentId;

  let senderName = "";
  let senderAvatar = "";

  if (typeof message.senderId === "object" && message.senderId !== null) {
    //  lấy thông tin hiển thị
    const senderObj = message.senderId as {
      displayName?: string;
      avatarUrl?: string;
    };
    senderName = senderObj.displayName ?? "";
    senderAvatar = senderObj.avatarUrl ?? "";
  }

  const isRecalled = Boolean(message.deletedAt);
  const canEdit = message.isOwn && !isRecalled && !!message.content;

  // gom cảm xúc theo emoji
  const reactionGroups = REACTIONS.map((emoji) => {
    const list = (message.reactions ?? []).filter((r) => r.emoji === emoji);
    return {
      emoji,
      count: list.length,
      mine: list.some((r) => r.userId === user?._id),
    };
  }).filter((g) => g.count > 0);

  const closeActions = () => {
    setPickerOpen(false);
    setShowActions(false);
  };

  const handleRecall = async () => {
    closeActions();
    if (window.confirm("Thu hồi tin nhắn này với mọi người?")) {
      await recallMessage(message._id);
    }
  };

  const reply = message.replyTo;
  const replyText = reply
    ? reply.deletedAt
      ? RECALLED_TEXT
      : reply.content || (reply.imgUrl ? "[Hình ảnh]" : "")
    : "";

  const actionBtn =
    "p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer";

  return (
    <div
      className={cn(
        "flex gap-2 message-bounce",
        message.isOwn ? "justify-end" : "justify-start"
      )}
    >
      {/* hiện avater khi là tin nhắn của người khác --- */}
      {!message.isOwn && (
        <div className="flex flex-col justify-start w-8">
          {/*  invisible ẩn avatar */}
          <div className={cn(!isGroup && "invisible")}>
            <UserAvatar
              type="chat"
              name={senderName}
              avatarUrl={senderAvatar}
            />
          </div>
        </div>
      )}

      {/* nội dung */}
      <div
        className={cn(
          "flex flex-col max-w-xs gap-1 group",
          message.isOwn ? "items-end" : "items-start"
        )}
      >
        {/* tên người gửi trong nhóm  hiện ở tin đầu tiên của chuỗi */}
        {!message.isOwn && isGroup && convo.type === "group" && (
          <span className="text-[12px] text-muted-foreground ml-1">
            {senderName}
          </span>
        )}

        <div
          className={cn(
            "flex items-center gap-1",
            message.isOwn && "flex-row-reverse"
          )}
        >
          <div className="relative min-w-0">
            <Card
              onClick={() => !isRecalled && setShowActions((v) => !v)}
              className={cn(
                "p-2 px-3 rounded shadow-sm",
                isRecalled
                  ? "bg-transparent border border-dashed text-muted-foreground italic"
                  : message.isOwn && !message.imgUrl
                  ? "chat-bubble-sent border-0"
                  : !message.isOwn && "bg-chat-bubble-received"
              )}
            >
              {isRecalled ? (
                <p className="text-sm">{RECALLED_TEXT}</p>
              ) : (
                <>
                  {/* trích dẫn tin nhắn được trả lời */}
                  {reply && (
                    <div className="mb-1 border-l-2 border-primary/60 pl-2 text-xs opacity-80 max-w-56">
                      <p className="font-semibold truncate">
                        {reply.senderId?.displayName ?? ""}
                      </p>
                      <p className="truncate">{replyText}</p>
                    </div>
                  )}
                  {/* hiển thị ảnh */}
                  {message.imgUrl && (
                    <a
                      href={message.imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        className="w-40 h-auto  cursor-pointer"
                        src={message.imgUrl}
                        alt={message._id}
                      ></img>
                    </a>
                  )}
                  {/* hiển thị nội dung */}
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                    {message.editedAt && (
                      <span className="ml-1 text-[10px] opacity-60">
                        (đã sửa)
                      </span>
                    )}
                  </p>
                </>
              )}
            </Card>

            {/* bảng chọn cảm xúc */}
            {pickerOpen && (
              <div
                className={cn(
                  "absolute -top-10 z-20 flex gap-1 rounded-full border bg-popover px-2 py-1 shadow-md",
                  message.isOwn ? "right-0" : "left-0"
                )}
              >
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-lg hover:scale-125 transition-transform cursor-pointer"
                    onClick={() => {
                      closeActions();
                      reactMessage(message._id, emoji);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* thanh công cụ: hiện khi rê chuột hoặc bấm vào tin nhắn */}
          {!isRecalled && (
            <div
              className={cn(
                "flex items-center shrink-0 transition-opacity focus-within:opacity-100",
                showActions || pickerOpen
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
            >
              <button
                type="button"
                title="Thả cảm xúc"
                className={actionBtn}
                onClick={() => setPickerOpen((v) => !v)}
              >
                <Smile size={16} />
              </button>
              <button
                type="button"
                title="Trả lời"
                className={actionBtn}
                onClick={() => {
                  closeActions();
                  setReplyingTo(message);
                }}
              >
                <Reply size={16} />
              </button>
              {canEdit && (
                <button
                  type="button"
                  title="Sửa"
                  className={actionBtn}
                  onClick={() => {
                    closeActions();
                    setEditingMessage(message);
                  }}
                >
                  <Pencil size={16} />
                </button>
              )}
              {message.isOwn && (
                <button
                  type="button"
                  title="Thu hồi"
                  className={actionBtn}
                  onClick={handleRecall}
                >
                  <Undo2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* cảm xúc đã thả */}
        {reactionGroups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reactionGroups.map((g) => (
              <button
                key={g.emoji}
                type="button"
                onClick={() => reactMessage(message._id, g.emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs bg-background/70 cursor-pointer",
                  g.mine && "border-primary bg-primary/10"
                )}
              >
                <span>{g.emoji}</span>
                <span>{g.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* hiện time ở tin nhắn cuối cùng của chuỗi  */}
        {timed && (
          <span className="flex gap-2 items-center text-xs text-muted-foreground px-1 mt-1 select-none">
            {formatMessageTime(new Date(message.createdAt))}

            {/* status đã xem */}
            {message.isOwn && message._id === convo.lastMessage?._id && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1 font-normal bg-background/50"
              >
                {lastMessageStatus ? "Đã xem" : "Đã nhận"}
              </Badge>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
