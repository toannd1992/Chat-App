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
  const { activeConversationId, sendDirectMessStore, sendGroupMessStore } =
    useChatStore();
  const [imgView, setImgView] = useState<string | null>(null); // tạo state để quản lý ảnh
  const inputRef = useRef<HTMLInputElement>(null);
  const inputMessage = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputMessage.current?.focus();
  }, [activeConversationId]);

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
  const handleMessage = async () => {
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

  const enter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleMessage();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Hiện ảnh */}
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
      <div className="flex gap-1 items-center">
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
          className="size-4 hover:bg-primary/10 transition-smooth cursor-pointer"
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          <ImagePlus className="size-4" />
        </Button>

        <div className="flex-1 relative flex gap-1">
          <Input
            value={value}
            ref={inputMessage}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={enter}
            placeholder={`Nhập @, tin nhắn tới ${name}`}
            className=" rounded focus-visible:border-none pr-20 h-9 bg-white border-border/50 focus:none transition-smooth resize-none"
          ></Input>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 size-4"
          >
            <Emoji onChange={(emoji) => setValue(`${value}${emoji}`)} />
          </Button>
          {/* emoji */}
          <div className="absolute right_2 top-1/2"></div>
          <Button
            onClick={handleMessage}
            className="hover:scale-105 cursor-pointer transition-smooth bg-gradient-chat"
            disabled={!value.trim() && !imgView}
          >
            <Send className="text-white " />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InputMessage;
