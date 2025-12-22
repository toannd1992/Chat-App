import { useChatStore } from "@/stores/useChatStore";
import MessageItem from "./MessageItem";
import InputMessage from "./InputMessage";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Spinner } from "@/components/ui/spinner";

const BodyMessage = () => {
  const { activeConversationId, conversations, messages, fetchMessages } =
    useChatStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false); //
  // lấy dữ liệu
  const mess = useMemo(() => {
    return messages[activeConversationId!]?.items ?? [];
  }, [messages, activeConversationId]);

  const hasMore = messages[activeConversationId!]?.hasMore;
  const convo = conversations.find((item) => item._id === activeConversationId);

  // duyệt seenBy để hiện thị trạng thái
  const otherUserId = convo?.participants
    .find((p) => p.userId?._id !== user?._id)
    ?.userId?._id.toString();
  let lastMessageStatus: boolean | undefined;

  if (otherUserId) {
    lastMessageStatus = convo?.seenBy.includes(otherUserId);
  }

  // sử dụng useRef để đến đểm cuối của khung message

  const scrollRef = useRef<HTMLDivElement>(null); // khung massage
  useEffect(() => {
    const container = scrollRef.current;

    // không có container, không có tin nhắn hoặc đang loading thì bỏ qua
    if (!container || mess.length === 0 || loading) return;

    // lấy tin nhắn mới nhất

    const latestMessage = mess[mess.length - 1];

    // kiểm tra xem tin nhắn đó có phải của mình không
    const isMine = latestMessage?.senderId?._id === user?._id;

    // kiểm tra xem người dùng có đang đứng gần đáy 100px
    const isNearBottom = Math.abs(container.scrollTop) < 100;
    // nếu tin của mình thì cuộn xuống
    if (isMine || isNearBottom) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [mess, activeConversationId, user?._id]);

  // hàm scroll để fetch message mới

  const handleScroll = async () => {
    const container = scrollRef.current;
    if (!container || !hasMore || loading) return;

    const scrollPosition = Math.abs(container.scrollTop);
    const isAtTop =
      container.scrollHeight - container.clientHeight - scrollPosition <= 50;

    if (isAtTop) {
      setLoading(true);
      await fetchMessages(activeConversationId!);

      setLoading(false);
    }
  };

  if (!convo) return;

  return (
    // content
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* nếu đang tải tin nhắn thì hiện vòng tròn xoay */}
      {loading && (
        <div className="bg-primary-foreground flex items-center justify-center p-4">
          <Spinner className="size-6" />
        </div>
      )}
      {/* phần message */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 beautiful-scrollbar p-4 bg-primary-foreground overflow-y-auto flex flex-col-reverse"
      >
        <div className="flex flex-col gap-2">
          {mess.map((item, index) => (
            <MessageItem
              key={item._id}
              message={item}
              index={index}
              convo={convo}
              messages={mess}
              lastMessageStatus={lastMessageStatus}
            />
          ))}
        </div>
      </div>
      {mess.length === 0 && (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Chưa có tin nhắn nào trong cuộc trò chuyện này. Hãy trò chuyện ngay
        </div>
      )}
      {/* input */}
      <div className="p-2 border-t ">
        <InputMessage conversation={convo} />
      </div>
    </div>
  );
};

export default BodyMessage;
