import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useThemeStore } from "@/stores/useThemeStore";
import { Avatar } from "@radix-ui/react-avatar";
import { Search, UserPlus2, Users2 } from "lucide-react";
import { useState } from "react";

const NavChat = () => {
  const { setAddFriend, setCreateGroup } = useThemeStore();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const handleIsOpenAddFriend = () => {
    const isOpen = true;
    setAddFriend(isOpen);
  };

  const handleIsOpenCreateGroup = () => {
    const isOpen = true;
    setCreateGroup(isOpen);
  };
  return (
    <div className="relative flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-2.5 left-2.5 text-muted-foreground size-4" />
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onClick={() => setOpen(true)}
              placeholder="Tìm kiếm"
              className="pl-8 rounded "
            ></Input>
          </div>
        </PopoverTrigger>
        <PopoverContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-90 rounded "
        >
          <ScrollArea className="h-56 rounded border p-2">
            {/* <div className="space-y-2 ">
              {friends.map((user) => (
                <div
                  key={user._id}
                  className={cn(
                    "flex items-center  justify-start gap-4 border rounded p-1 pl-4 hover:bg-muted",
                    memberIds.includes(user._id) && "bg-muted-foreground/30"
                  )}
                >
                  <Checkbox
                    checked={memberIds.includes(user._id)}
                    onCheckedChange={() => toggleUser(user._id)}
                    className="cursor-pointer hover:border"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>
                        {user.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <span className="text-xs font-medium flex-1 truncate max-w-60  ">
                      {user.displayName}
                    </span>
                  </div>
                </div>
              ))}
            </div> */}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <div className="flex gap-2 border-none">
        <Button
          onClick={handleIsOpenAddFriend}
          variant="ghost"
          className="rounded cursor-pointer"
        >
          <UserPlus2 className="size-4" />
        </Button>
        <Button
          onClick={handleIsOpenCreateGroup}
          variant="ghost"
          className="rounded cursor-pointer"
        >
          <Users2 className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default NavChat;
