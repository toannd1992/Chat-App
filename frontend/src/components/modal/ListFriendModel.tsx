"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Input } from "@/components/ui/input";

import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useMemo, useRef, useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";

import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import { Ellipsis, Search, TextInitial, X } from "lucide-react";

interface ListFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const ListFriendModel = ({ isOpen, onClose }: ListFriendModalProps) => {
  const [value, setValue] = useState("");
  const [alert, setAlert] = useState(false);
  const [name, setName] = useState("");
  const id = useRef<string | null>(null);

  const { friends, deleteFriend } = useFriendStore();
  const {
    setActiveConversation,
    conversations,
    fetchMessages,
    createConversation,
  } = useChatStore.getState();

  const handleClickFriend = async (id: string) => {
    // lọc conversation để tìm conversationId

    const conversation = conversations.find(
      (c) =>
        c.type === "direct" && c.participants.some((p) => p.userId?._id === id)
    );
    if (conversation) {
      //set lại activeconversation
      setActiveConversation(conversation._id);

      await fetchMessages(conversation._id); // lay tin nham khi lick vao hoi thoai
    } else {
      // nếu chưa có thị tạo mới
      const type = "direct";
      const memberIds = [id];
      createConversation(type, memberIds);
    }

    setValue("");

    onClose();
  };

  const onCloseAlert = () => {
    setAlert(false);
  };

  const handleDeleteFriend = async (id: string | null) => {
    if (id) {
      try {
        await deleteFriend(id);
      } catch (error) {
        console.error(error);
      }
    }
  };
  // lọc bạn bè
  const filterFriend = useMemo(() => {
    if (!value.trim()) return friends;
    return friends.filter((f) => {
      return f.displayName.toLowerCase().includes(value.toLowerCase());
    });
  }, [value, friends]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center text-muted-foreground">
            <TextInitial className="size-5" />
            Danh sách bạn bè
          </DialogTitle>
          <DialogDescription />
          <Separator />
        </DialogHeader>

        {/* Group name */}
        <div className="relative space-y-2">
          <Search className="absolute top-2.5 left-2.5 text-muted-foreground size-4" />
          <Input
            className="rounded pl-8"
            placeholder="Tìm bạn"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {value && (
            <X
              onClick={() => setValue("")}
              className="absolute top-2.5 right-2.5 text-muted-foreground size-4 bg-muted hover:bg-muted-foreground/20 cursor-pointer"
            />
          )}
        </div>

        {/* danh sách bạn bè */}
        <div className="space-y-2">
          <ScrollArea className="h-70 rounded border p-2">
            <div className="space-y-2 ">
              {filterFriend.length > 0 ? (
                filterFriend.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center cursor-pointer justify-start gap-4  rounded p-2 hover:bg-muted/70"
                  >
                    <div
                      onClick={() => handleClickFriend(user._id)}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl} alt="avartar" />
                        <AvatarFallback>
                          {user.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <span className="text-sm font-medium flex-1 truncate max-w-60  ">
                        {user.displayName}
                      </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="completedGhost"
                          size="icon-sm"
                          className="cursor-pointer rounded hover:bg-muted-foreground/10 p-1"
                        >
                          <Ellipsis className=" p-1 size-6 text-muted-foreground rounded cursor-pointer hover:bg-muted-foreground/30" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-35" align="start">
                        <DropdownMenuGroup>
                          <DropdownMenuItem className="cursor-pointer dark:hover:text-white/50">
                            Xem thông tin
                          </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            id.current = user._id;
                            setAlert(true);
                            setName(user.displayName);
                          }}
                          className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                        >
                          Xóa bạn bè
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              ) : (
                <div className="flex flex-col gap-3 items-center justify-center text-muted-foreground  p-2 pt-20 text-sm ">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="44"
                    height="44"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-scan-search-icon lucide-scan-search"
                  >
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="m16 16-1.9-1.9" />
                  </svg>
                  Không tìm thấy kết quả
                </div>
              )}
            </div>
            {friends.length === 0 && (
              <div className="flex items-center justify-center text-muted-foreground  p-2 text-sm ">
                Chưa có bạn bè nào trong danh sách, Vui lòng kết bạn để nói
                chuyện!"
              </div>
            )}
          </ScrollArea>
        </div>
        <AlertDialog open={alert} onOpenChange={onCloseAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận</AlertDialogTitle>
              <AlertDialogDescription>
                Xóa <span className="text-red-500">{name}</span> khỏi danh sách
                bạn bè?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="hover:bg-muted cursor-pointer rounded">
                Không
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteFriend(id.current)}
                className="text-white bg-destructive/50 hover:bg-destructive cursor-pointer rounded"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default ListFriendModel;
