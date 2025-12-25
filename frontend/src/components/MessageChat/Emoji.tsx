import { useThemeStore } from "@/stores/useThemeStore";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Smile } from "lucide-react";
import Picker from "@emoji-mart/react";

import data from "@emoji-mart/data";

interface IEmoji {
  onChange: (value: string) => void;
}

const Emoji = ({ onChange }: IEmoji) => {
  const { isDark } = useThemeStore();
  return (
    <Popover>
      <PopoverTrigger>
        <Smile className="size-5 cursor-pointer mb-2.5" />
      </PopoverTrigger>
      <PopoverContent
        side="left"
        sideOffset={100}
        className="border-none shadow-none mb-12 bg-tranparent "
      >
        <Picker
          theme={isDark ? "dark" : "light"}
          data={data}
          onEmojiSelect={(emoji: any) => onChange(emoji.native)}
          emojiSize={24}
        />
      </PopoverContent>
    </Popover>
  );
};

export default Emoji;
