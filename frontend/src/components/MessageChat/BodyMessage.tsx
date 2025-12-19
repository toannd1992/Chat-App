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
  const bottomRef = useRef<HTMLDivElement>(null); // thẻ div cuối tin nhắn
  const scrollRef = useRef<HTMLDivElement>(null); // khung massage

  useEffect(() => {
    // cuộn xuống cuối khi có tin nhắn mới và khi không tải tin nhắn mới
    if (bottomRef.current && mess.length > 0 && !loading) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mess, activeConversationId]);

  // hàm scroll để fetch message mới

  const handleScroll = async () => {
    const container = scrollRef.current;
    if (!container) return;

    // cuộn lên top = 0 và còn tin nhắn cũ thì
    if (container.scrollTop === 0 && hasMore && !loading) {
      setLoading(true); // đang tải tin nhắn
      const oldHeightContainer = container.scrollHeight; // chiều cao khung khi chưa có tin mới

      await fetchMessages(activeConversationId!);
      // tính toán vị trí cuộn và setTimeout 0 để DOM update
      setTimeout(() => {
        if (container) {
          const newHeightContainer = container.scrollHeight;
          //cuộn xuống đúng chỗ chiều cao mới - chiều cao cũ
          container.scrollTop = newHeightContainer - oldHeightContainer;
        }
        // khi gọi api xong thì set loading về false
        setLoading(false);
      }, 0);
    }
  };

  if (!mess) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Chưa có tin nhắn nào trong cuộc trò chuyện này
      </div>
    );
  }
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
        className="flex-1 beautiful-scrollbar p-4 bg-primary-foreground overflow-y-auto "
      >
        <div className="flex flex-col gap-2">
          {mess.map((item, index) => (
            <MessageItem
              key={index}
              message={item}
              index={index}
              convo={convo}
              messages={mess}
              lastMessageStatus={lastMessageStatus}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      {/* input */}
      <div className="p-2 border-t ">
        <InputMessage conversation={convo} />
      </div>
    </div>
  );
};

export default BodyMessage;
