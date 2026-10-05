import { useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { apiError } from "@/lib/utils";
import { authServices } from "@/services/authServices";
import { useAuthStore } from "@/stores/useAuthStore";

// đổi mật khẩu và đăng xuất khỏi mọi thiết bị
const SecuritySection = () => {
  const { signOutAllStore } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const error =
    next && next.length < 6
      ? "Mật khẩu mới phải có ít nhất 6 ký tự"
      : confirm && confirm !== next
      ? "Mật khẩu nhập lại không khớp"
      : "";
  const canSubmit = !!current && next.length >= 6 && next === confirm && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await authServices.changePassword(current, next);
      toast.success("Đổi mật khẩu thành công, các thiết bị khác đã bị đăng xuất");
      setCurrent("");
      setNext("");
      setConfirm("");
      setOpen(false);
    } catch (err) {
      toast.error(apiError(err, "Đổi mật khẩu thất bại, vui lòng thử lại"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-base text-foreground border-b pb-2">
        Bảo mật
      </h3>

      {!open ? (
        <Button
          variant="ghost"
          onClick={() => setOpen(true)}
          className="w-full justify-start gap-2 cursor-pointer"
        >
          <KeyRound size={16} />
          Đổi mật khẩu
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div className="space-y-1">
            <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="h-9 rounded"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-password">Mật khẩu mới</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              maxLength={72}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="h-9 rounded"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm-password">Nhập lại mật khẩu mới</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              maxLength={72}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-9 rounded"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                setOpen(false);
                setCurrent("");
                setNext("");
                setConfirm("");
              }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="cursor-pointer rounded"
            >
              {saving && <Spinner className="size-4" />}
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      )}

      <Button
        variant="ghost"
        onClick={() => {
          if (window.confirm("Đăng xuất khỏi tất cả thiết bị, kể cả thiết bị này?")) {
            signOutAllStore();
          }
        }}
        className="w-full justify-start gap-2 text-destructive hover:text-destructive cursor-pointer"
      >
        <LogOut size={16} />
        Đăng xuất khỏi mọi thiết bị
      </Button>
    </div>
  );
};

export default SecuritySection;
