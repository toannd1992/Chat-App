import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/typeChat";
import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ImagePlus, Send } from "lucide-react";
import Emoji from "./Emoji";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";

const InputMessage = ({ conversation }: { conversation: Conversation }) => {
  const { user } = useAuthStore();
  const [value, setValue] = useState<string>("");
  const { sendDirectMessStore, sendGroupMessStore } = useChatStore();

  if (!user) return;

  let name;
  if (conversation.type === "direct") {
    name = conversation.participants.find(
      (item) => item?.userId?._id?.toString() !== user?._id.toString()
    )?.userId?.displayName;
  } else {
    name = conversation.group.name;
  }

  const handleMessage = async () => {
    if (!value.trim()) return;
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
        await sendDirectMessStore(targetUserId, value);
      } else {
        await sendGroupMessStore(value, conversation._id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn");
    } finally {
      setValue("");
    }
  };

  const enter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleMessage();
    }
  };

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-primary/10 transition-smooth cursor-pointer"
      >
        <ImagePlus className="size-4" />
      </Button>
      <Button asChild variant="ghost" size="icon" className="size-4">
        <Emoji onChange={(emoji) => setValue(`${value}${emoji}`)} />
      </Button>
      <div className="flex-1 relative flex gap-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={enter}
          placeholder={`Nhập @, tin nhắn tới ${name}`}
          className=" rounded focus-visible:border-none pr-20 h-9 bg-white border-border/50 focus:none transition-smooth resize-none"
        ></Input>
        {/* emoji */}
        <div className="absolute right_2 top-1/2"></div>
        <Button
          onClick={handleMessage}
          className="hover:scale-105 cursor-pointer transition-smooth bg-gradient-chat"
          disabled={!value.trim()}
        >
          <Send className="text-white " />
        </Button>
      </div>
    </div>
  );
};

export default InputMessage;
