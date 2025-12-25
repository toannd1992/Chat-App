import UserAvatar from "@/chat/UserAvatar";
import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message } from "@/types/typeChat";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

interface IMessage {
  message: Message;
  index: number;
  messages: Message[];
  convo: Conversation;
  lastMessageStatus?: boolean;
}

const MessageItem = ({
  message,
  index,
  messages,
  convo,
  lastMessageStatus,
}: IMessage) => {
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

        <Card
          className={cn(
            "p-2 px-3 rounded shadow-sm",
            message.isOwn && !message.imgUrl && "chat-bubble-sent border-0",
            !message.isOwn && "bg-chat-bubble-received"
          )}
        >
          {/* hiển thị ảnh */}
          {message.imgUrl && (
            <a href={message.imgUrl} target="_blank" rel="noopener noreferrer">
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
          </p>
        </Card>

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
