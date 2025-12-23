import UserAvatar from "@/chat/UserAvatar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Camera, Pencil, RotateCcw, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Spinner } from "../ui/spinner";
import { formatDate } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogDescription } from "@radix-ui/react-dialog";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user, updateAvatar, updateProfile } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputNameRef = useRef<HTMLInputElement>(null);

  const [loadingAvatar, setloadingAvatar] = useState(false);
  const [loadingProfile, setloadingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Thông tin cá nhân
  const [formData, setFormData] = useState(() => ({
    displayName: user?.displayName || "",
    gender: user?.gender || "Nam",
    birthday: user?.birthday || "",
    phone: user?.phone || "",
  }));

  // Reset form khi đóng/mở modal hoặc user thay đổi
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        displayName: user.displayName || "",
        gender: user.gender || "Nam",
        birthday: user.birthday || "",
        phone: user.phone || "",
      });
      setIsEditing(false);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputNameRef.current?.focus(), 100);
    }
  }, [isEditing]);

  if (!user) return null;

  // xử lý đóng modal
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setIsEditing(false); // reset trạng thái edit khi đóng
    }
  };

  // nén avatar
  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    try {
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };

      setloadingAvatar(true);
      const compressedFile = await imageCompression(file, options);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        await updateAvatar(base64Image);
        setloadingAvatar(false);
      };

      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Lỗi nén hoặc upload ảnh:", error);
      setloadingAvatar(false);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfile = async () => {
    if (!formData.displayName.trim()) return;
    try {
      setloadingProfile(true);
      await updateProfile({
        displayName: formData.displayName,
        phone: formData.phone,
        birthday: formData.birthday,
        gender: formData.gender,
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setloadingProfile(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user.displayName,
      gender: user.gender || "Nam",
      birthday: user.birthday || "",
      phone: user.phone || "",
    });
    setIsEditing(false);
  };

  const coverImage =
    "https://res.cloudinary.com/diceou10a/image/upload/v1765594353/samples/balloons.jpg";

  const checkData =
    formData.displayName !== user.displayName ||
    (formData.gender || "Nam") !== (user.gender || "Nam") ||
    (formData.birthday || "") !== (user.birthday || "") ||
    (formData.phone || "") !== (user.phone || "");

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className=" sm:max-w-[400px] p-0 overflow-hidden gap-0 border-border">
        <DialogHeader className="min-h-10 items-center justify-center">
          <DialogTitle className="text-center">Thông tin tài khoản</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        {/* header */}
        <div className="relative">
          {/* overlay */}
          <div className="absolute top-0 left-0 w-full z-10 flex items-center justify-between p-3 px-4 bg-gradient-to-b from-black/50 to-transparent"></div>

          {/* Ảnh bìa */}
          <div className="h-40 w-full overflow-hidden bg-muted">
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-10 left-4">
            <div className="relative group">
              {loadingAvatar ? (
                <div className="relative w-20 h-20 rounded-full shadow-md bg-background flex items-center justify-center border-[3px] border-background">
                  <Spinner className="size-6 text-muted-foreground" />
                </div>
              ) : (
                <UserAvatar
                  type="profile"
                  name={user.displayName}
                  avatarUrl={user.avatarUrl}
                  className="w-20 h-20 rounded-full border-[3px] border-background object-cover shadow-md bg-background"
                />
              )}

              {/* Nút upload avatar */}
              <button
                disabled={loadingAvatar}
                className="cursor-pointer absolute bottom-0 right-0 bg-secondary hover:bg-secondary/80 p-1.5 rounded-full border border-background shadow-sm transition-colors z-20"
                onClick={() => inputRef.current?.click()}
              >
                <Camera size={14} className="text-muted-foreground" />
              </button>
              <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImage}
              />
            </div>
          </div>
        </div>

        {/* body */}
        <div className="pt-12 px-6 pb-2 space-y-6">
          {/* name */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                {loadingProfile ? (
                  <Spinner className="text-muted-foreground" />
                ) : (
                  <h1 className="text-xl font-bold text-foreground">
                    {user.displayName}
                  </h1>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil size={14} className="text-muted-foreground" />
                </Button>
              </>
            ) : (
              <Input
                ref={inputNameRef}
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleProfile()}
                className="text-xl font-bold h-9 rounded"
              />
            )}
          </div>

          {/* thông tin */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base text-foreground border-b pb-2">
              Thông tin cá nhân
            </h3>

            <div className="space-y-4 text-sm">
              {/* giới tính */}
              <div className="grid grid-cols-3 gap-4 items-center h-7">
                <Label className="text-muted-foreground font-normal">
                  Giới tính
                </Label>
                <div className="col-span-2">
                  {isEditing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className=" flex h-9 w-full rounded border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  ) : (
                    <span className="text-foreground font-medium pl-1">
                      {user.gender || "Chưa cập nhật"}
                    </span>
                  )}
                </div>
              </div>

              {/* ngày sinh */}
              <div className="grid grid-cols-3 gap-4 items-center h-7">
                <Label className="text-muted-foreground font-normal">
                  Ngày sinh
                </Label>
                <div className="col-span-2">
                  {isEditing ? (
                    <Input
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      className="h-9 rounded"
                    />
                  ) : (
                    <span className="text-foreground font-medium pl-1">
                      {formatDate(user.birthday) || "Chưa cập nhật"}
                    </span>
                  )}
                </div>
              </div>

              {/* điện thoại */}
              <div className="grid grid-cols-3 gap-4 items-center h-7 ">
                <Label className="text-muted-foreground font-normal">
                  Điện Thoại
                </Label>
                <div className="col-span-2">
                  {isEditing ? (
                    <Input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Nhập số điện thoại"
                      className="h-9 rounded"
                    />
                  ) : (
                    <span className="text-foreground font-medium pl-1">
                      {user.phone || "Chưa cập nhật"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <DialogFooter className="p-4 pt-2">
          {!isEditing ? (
            <Button
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="w-full gap-2 cursor-pointer"
            >
              <Pencil size={16} />
              Cập nhật
            </Button>
          ) : (
            <div className="flex gap-3 w-full justify-end">
              <Button
                variant="destructive"
                onClick={handleCancel}
                className="bg-destructive/40  hover:bg-destructive/80 rounded cursor-pointer"
              >
                <RotateCcw size={14} />
                Hủy
              </Button>

              <Button
                onClick={handleProfile}
                variant="ghost"
                disabled={loadingProfile || !checkData}
                className="gap-2 rounded hover:bg-muted-foreground/60 cursor-pointer"
              >
                {loadingProfile ? (
                  <Spinner className="size-4 text-primary-foreground" />
                ) : (
                  <Save size={16} />
                )}
                Lưu
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
