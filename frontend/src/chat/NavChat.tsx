import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useThemeStore } from "@/stores/useThemeStore";

import { Search, UserPlus2, Users2, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation, Participant } from "@/types/typeChat";
import ChatCard from "./ChatCard";
import UserAvatar from "./UserAvatar";
import GroupAvatar from "./GroupAvatar";

const NavChat = () => {
  const { setAddFriend, setCreateGroup } = useThemeStore();
  const {
    conversations,
    setActiveConversation,
    activeConversationId,
    messages,
    fetchMessages,
  } = useChatStore(); // Lấy danh sách chat
  const { user } = useAuthStore(); // Lấy user hiện tại để lọc tên đối phương

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const handleIsOpenAddFriend = () => {
    setAddFriend(true);
  };

  const handleIsOpenCreateGroup = () => {
    setCreateGroup(true);
  };

  // lọc dữ liệu từ conversations
  const filteredConversations = useMemo(() => {
    if (!value.trim()) return []; // k nhập trả về rỗng

    return conversations.filter((convo) => {
      let name = "";

      // lọc group
      if (convo.type === "group") {
        name = convo.group?.name || "";
      }
      // direct tìm người còn lại
      else {
        const otherParticipant = convo.participants.find(
          (p) => p.userId?._id !== user?._id
        );
        name = otherParticipant?.userId?.displayName || "";
      }

      //  không phân biệt hoa thường
      return name.toLowerCase().includes(value.toLowerCase());
    });
  }, [conversations, value, user]);

  //  click vào kết quả tìm kiếm

  const handleSelect = async (id: string) => {
    setActiveConversation(id);
    setOpen(false); // đóng popover
    setValue("");
    if (!messages[id]) {
      await fetchMessages(id); // lay tin nham khi lick vao hoi thoai
    }
  };

  //  lấy thông tin hiển thị
  const getInfo = (convo: Conversation) => {
    if (convo.type === "group") {
      return {
        name: convo.group?.name ?? "",
        subtitle: convo.lastMessage?.content,
        timestamp: convo.lastMessage?.createdAt
          ? new Date(convo.lastMessage.createdAt)
          : undefined,
      };
    }
    const otherUser = convo.participants.find(
      (p: Participant) => p.userId?._id !== user?._id
    );
    return {
      name: otherUser?.userId?.displayName ?? "",
      subtitle: convo.lastMessage?.content ?? "",
      timestamp: convo.lastMessage?.createdAt
        ? new Date(convo.lastMessage.createdAt)
        : undefined,
      avatarUrl: otherUser?.userId?.avatarUrl ?? undefined,
    };
  };

  return (
    <div className="relative flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-2.5 left-2.5 text-muted-foreground size-4" />
            <Input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (!open) setOpen(true); //  mở popover khi gõ
              }}
              onClick={() => setOpen(true)}
              placeholder="Tìm kiếm nhóm, bạn bè..."
              className="pl-8 rounded"
            />
            {value && (
              <X
                onClick={() => setValue("")}
                className="absolute top-2.5 right-2.5 text-muted-foreground size-4 bg-muted hover:bg-muted-foreground/20 cursor-pointer"
              />
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-90 p-0 rounded-md" //
          align="start"
        >
          <ScrollArea className="h-full">
            <div className="p-2 flex flex-col gap-1">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((convo) => {
                  const info = getInfo(convo);
                  return (
                    <ChatCard
                      key={convo._id}
                      convoId={convo._id}
                      name={info.name}
                      timestamp={info.timestamp}
                      subtitle={info.subtitle}
                      isActive={activeConversationId === convo._id}
                      onSelect={handleSelect}
                      leftSection={
                        convo.type === "direct" ? (
                          <UserAvatar
                            type="sidebar"
                            name={info.name}
                            avatarUrl={info.avatarUrl}
                          />
                        ) : (
                          <GroupAvatar
                            participants={convo.participants}
                            type="group"
                          />
                        )
                      }
                    />
                  );
                })
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {value ? "Không tìm thấy kết quả" : "Nhập tên để tìm kiếm"}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <div className="flex gap-2 border-none">
        <Button
          onClick={handleIsOpenAddFriend}
          variant="ghost"
          className="rounded cursor-pointer"
          title="Thêm bạn"
        >
          <UserPlus2 className="size-4" />
        </Button>
        <Button
          onClick={handleIsOpenCreateGroup}
          variant="ghost"
          className="rounded cursor-pointer"
          title="Tạo nhóm"
        >
          <Users2 className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default NavChat;
