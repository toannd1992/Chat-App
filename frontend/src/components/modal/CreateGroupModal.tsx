"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupModal = ({ isOpen, onClose }: CreateGroupModalProps) => {
  const [nameGroup, setNameGroup] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const { friends } = useFriendStore();
  const { createConversation } = useChatStore();

  const toggleUser = (userId: string) => {
    setMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    const type = "group";
    try {
      await createConversation(type, memberIds, nameGroup);
    } catch (error) {
      console.error(error);
    } finally {
      setNameGroup("");
      setMemberIds([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Tạo nhóm</DialogTitle>
          <DialogDescription />
          <Separator />
        </DialogHeader>

        {/* Group name */}
        <div className="space-y-2">
          <Input
            className="rounded dark:shadow-white/20"
            placeholder="Nhập tên nhóm..."
            value={nameGroup}
            onChange={(e) => setNameGroup(e.target.value)}
          />
        </div>

        <Separator />

        {/* danh sách bạn bè */}
        <div className="space-y-2">
          <Label>Chọn thành viên</Label>

          <ScrollArea className="h-56 rounded border p-2">
            <div className="space-y-2 ">
              {friends.length > 0 ? (
                friends.map((user) => (
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
                      className="cursor-pointer hover:border dark:border-white/30"
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
                ))
              ) : (
                <div className="flex items-center justify-center text-muted-foreground  p-2 text-sm ">
                  Chưa có bạn bè nào trong danh sách, Vui lòng kết bạn để tạo
                  nhóm!"
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Action */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            variant="destructive"
            className="rounded cursor-pointer"
          >
            Hủy
          </Button>{" "}
          <Button
            variant="ghost"
            className="rounded bg-muted cursor-pointer"
            disabled={!nameGroup || memberIds.length < 2}
            onClick={handleCreateGroup}
          >
            Tạo nhóm{memberIds.length > 0 && ` (${memberIds.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default CreateGroupModal;
