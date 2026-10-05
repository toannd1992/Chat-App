import { useMemo, useState } from "react";
import { Crown, ShieldCheck, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiError } from "@/lib/utils";
import { chatServices } from "@/services/chatServices";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import type { Conversation } from "@/types/typeChat";

interface Props {
  convo: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

const GroupInfoModal = ({ convo, isOpen, onClose }: Props) => {
  const { user } = useAuthStore();
  const { friends } = useFriendStore();
  const { patchConversation } = useChatStore();
  const [name, setName] = useState(convo.group?.name ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const ownerId = convo.group?.createdBy;
  const admins = convo.group?.admins ?? [];
  const isOwner = ownerId === user?._id;
  const isAdmin = admins.includes(user?._id ?? "");
  const canManage = isOwner || isAdmin;

  const members = convo.participants.filter((p) => p.userId);
  const memberIds = members.map((p) => p.userId!._id);
  // bạn bè chưa ở trong nhóm
  const addable = useMemo(
    () => friends.filter((f) => !memberIds.includes(f._id)),
    [friends, memberIds]
  );

  // chạy một thao tác với server, báo lỗi nếu có và cập nhật nhóm theo kết quả
  const run = async (
    action: () => Promise<{ conversation?: Conversation }>,
    success?: string
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await action();
      if (res.conversation) patchConversation(res.conversation);
      if (success) toast.success(success);
    } catch (error) {
      toast.error(apiError(error, "Thao tác thất bại, vui lòng thử lại"));
    } finally {
      setBusy(false);
    }
  };

  const saveName = () => {
    const next = name.trim();
    if (!next || next === convo.group?.name) return;
    run(() => chatServices.renameGroup(convo._id, next), "Đã đổi tên nhóm");
  };

  const addSelected = () => {
    if (selected.length === 0) return;
    run(async () => {
      const res = await chatServices.addMembers(convo._id, selected);
      setSelected([]);
      return res;
    }, "Đã thêm thành viên");
  };

  const roleOf = (id: string) =>
    id === ownerId ? "owner" : admins.includes(id) ? "admin" : "member";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Thông tin nhóm</DialogTitle>
          <DialogDescription />
          <Separator />
        </DialogHeader>

        {/* tên nhóm */}
        <div className="space-y-2">
          <Label>Tên nhóm</Label>
          <div className="flex gap-2">
            <Input
              value={name}
              disabled={!canManage}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="rounded"
            />
            {canManage && (
              <Button
                onClick={saveName}
                disabled={
                  busy || !name.trim() || name.trim() === convo.group?.name
                }
                className="rounded cursor-pointer"
              >
                Lưu
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* thành viên */}
        <div className="space-y-2">
          <Label>Thành viên ({members.length})</Label>
          <div className="max-h-52 overflow-y-auto rounded border p-2">
            <div className="space-y-1">
              {members.map((m) => {
                const info = m.userId!;
                const role = roleOf(info._id);
                const isMe = info._id === user?._id;
                // chủ nhóm quản lý được tất cả, phó nhóm chỉ xóa được thành viên thường
                const canRemove =
                  !isMe &&
                  ((isOwner && role !== "owner") ||
                    (isAdmin && role === "member"));
                return (
                  <div
                    key={info._id}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded p-1 hover:bg-muted"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={info.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        {info.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-24 flex-1 truncate text-sm">
                      {info.displayName}
                      {isMe && " (Bạn)"}
                    </span>
                    {role === "owner" && (
                      <Badge variant="outline" className="gap-1">
                        <Crown className="size-3" /> Chủ nhóm
                      </Badge>
                    )}
                    {role === "admin" && (
                      <Badge variant="outline" className="gap-1">
                        <ShieldCheck className="size-3" /> Phó nhóm
                      </Badge>
                    )}
                    {isOwner && !isMe && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          className="h-7 px-2 text-xs cursor-pointer"
                          onClick={() =>
                            run(() =>
                              chatServices.setAdmin(
                                convo._id,
                                info._id,
                                role !== "admin"
                              )
                            )
                          }
                        >
                          {role === "admin" ? "Bỏ phó nhóm" : "Làm phó nhóm"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          className="h-7 px-2 text-xs cursor-pointer"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Chuyển quyền chủ nhóm cho ${info.displayName}?`
                              )
                            ) {
                              run(
                                () =>
                                  chatServices.transferOwner(
                                    convo._id,
                                    info._id
                                  ),
                                "Đã chuyển quyền chủ nhóm"
                              );
                            }
                          }}
                        >
                          Chuyển quyền
                        </Button>
                      </>
                    )}
                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xóa khỏi nhóm"
                        disabled={busy}
                        className="size-7 text-destructive cursor-pointer"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Xóa ${info.displayName} khỏi nhóm?`
                            )
                          ) {
                            run(() =>
                              chatServices.removeMember(convo._id, info._id)
                            );
                          }
                        }}
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* thêm thành viên */}
        {canManage && (
          <div className="space-y-2">
            <Label>Thêm thành viên</Label>
            {addable.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tất cả bạn bè của bạn đã ở trong nhóm.
              </p>
            ) : (
              <>
                <div className="max-h-32 overflow-y-auto rounded border p-2">
                  <div className="space-y-1">
                    {addable.map((f) => (
                      <label
                        key={f._id}
                        className="flex cursor-pointer items-center gap-3 rounded p-1 hover:bg-muted"
                      >
                        <Checkbox
                          checked={selected.includes(f._id)}
                          onCheckedChange={() =>
                            setSelected((prev) =>
                              prev.includes(f._id)
                                ? prev.filter((id) => id !== f._id)
                                : [...prev, f._id]
                            )
                          }
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={f.avatarUrl} />
                          <AvatarFallback>
                            {f.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">
                          {f.displayName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={addSelected}
                  disabled={busy || selected.length === 0}
                  className="w-full rounded cursor-pointer"
                >
                  <UserPlus className="size-4" />
                  Thêm{selected.length > 0 && ` (${selected.length})`}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupInfoModal;
