import UserAvatar from "@/chat/UserAvatar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Camera, Pencil, RotateCcw, Save, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression"; // thư viện nén ảnh xuống cón 200kb
import { Spinner } from "../ui/spinner";
import { formatDate } from "@/lib/utils";

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

  // thông tin cá nhân
  const [formData, setFormData] = useState(() => ({
    displayName: user?.displayName || "",
    gender: user?.gender || "Nam",
    birthday: user?.birthday || "",
    phone: user?.phone || "",
  }));

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputNameRef.current?.focus(), 100);
    }
  }, [user, isEditing]);

  if (!isOpen || !user) return null;

  // xử lý ảnh avatar
  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    // chuyển đổi ảnh = FileReader
    // const reader = new FileReader();

    // reader.onloadend = async () => {
    //   const imgAvatar = reader.result as string;
    //   //  update avatar gửi lên server
    //   try {
    //     setloadingAvatar(true);
    //     await updateAvatar(imgAvatar);
    //   } catch (error) {
    //     console.error("lỗi update avatar", error);
    //   } finally {
    //     setloadingAvatar(false);
    //   }
    // };
    // reader.readAsDataURL(file);

    // dùng thư viện nén ảnh
    try {
      const options = {
        maxSizeMB: 0.2, //  dung lượng max 200kb
        maxWidthOrHeight: 500, // kích thước tối đa 500x500px
        useWebWorker: true, // dùng luồng phụ để không bị đơ trình duyệt
      };

      setloadingAvatar(true);

      //  nén
      const compressedFile = await imageCompression(file, options);

      //chuyển file đã nén sang Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // gửi ảnh đã nén lên server
        await updateAvatar(base64Image);
        setloadingAvatar(false);
      };

      reader.readAsDataURL(compressedFile); // đọc file đã nén
    } catch (error) {
      console.error("Lỗi nén hoặc upload ảnh:", error);
      setloadingAvatar(false);
    }
    // reset value
    if (inputRef.current) inputRef.current.value = "";
  };

  // lấy name và value để lưu vào state
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfile = async () => {
    if (!formData.displayName.trim()) return;
    setIsEditing(false);
    try {
      setloadingProfile(true);
      await updateProfile({
        displayName: formData.displayName,
        phone: formData.phone,
        birthday: formData.birthday,
        gender: formData.gender,
      });
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

  //  ảnh bìa
  const coverImage =
    "https://res.cloudinary.com/diceou10a/image/upload/v1765594353/samples/balloons.jpg";

  const checkData =
    formData.displayName !== user.displayName ||
    (formData.gender || "Nam") !== (user.gender || "Nam") ||
    (formData.birthday || "") !== (user.birthday || "") ||
    (formData.phone || "") !== (user.phone || "");
  return (
    // overlay
    <div className=" absolute inset-0 z-50 flex items-center justify-center bg-black/50  p-4">
      {/* container  */}
      <div className="w-full max-w-[400px] bg-background border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/*  HEADER */}
        <div className="flex items-center justify-between p-3 px-4 border-b bg-background">
          <h2 className="font-semibold text-lg">Thông tin tài khoản</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/*  BANNER & AVATAR */}
        <div className="relative">
          {/* ảnh bìa */}
          <div className="h-40 w-full overflow-hidden">
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>

          {/* avatar  */}
          <div className="absolute -bottom-10 left-4">
            <div className="relative group ">
              {loadingAvatar ? (
                <div className="relative w-20 h-20 rounded-full r shadow-md bg-background">
                  <Spinner className="size-6 absolute top-7 right-7 text-muted-foreground" />
                </div>
              ) : (
                <UserAvatar
                  type="profile"
                  name={user.displayName}
                  avatarUrl={user.avatarUrl}
                  className="w-20 h-20 rounded-full border-[3px] border-white object-cover shadow-md bg-background"
                />
              )}

              {/* nút upload avatar */}
              <button
                disabled={loadingAvatar}
                className="cursor-pointer absolute bottom-0 right-0 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full border border-white shadow-sm transition-colors"
                onClick={() => inputRef.current?.click()}
              >
                <Camera size={14} className="text-gray-600" />
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

        {/*  TÊN NGƯỜI DÙNG  */}
        <div className="mt-12 px-4 flex items-center gap-2 ">
          {!isEditing ? (
            <>
              {loadingProfile ? (
                <Spinner className="text-muted-foreground" />
              ) : (
                <h1 className="text-xl font-bold text-foreground  ">
                  {user.displayName}
                </h1>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="cursor-pointer p-1 hover:bg-gray-200 rounded-full text-gray-500"
              >
                <Pencil size={14} />
              </button>
            </>
          ) : (
            <>
              <input
                ref={inputNameRef}
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleProfile()}
                // onBlur={handleCancel}
                className="text-xl font-bold border px-2 py-1 rounded outline-none   focus:ring-blue-400"
              />
            </>
          )}
        </div>

        {/*  THÔNG TIN CÁ NHÂN  */}
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-base text-foreground border-b pb-2">
            Thông tin cá nhân
          </h3>

          <div className="space-y-3 text-sm">
            {/* giới tính */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <span className="text-muted-foreground col-span-1">
                Giới tính
              </span>

              <div className="col-span-2">
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full border rounded px-2 py-1 outline-none focus:border-blue-500 bg-background"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                ) : (
                  <span className="text-foreground font-medium">
                    {user.gender || "Chưa cập nhật"}
                  </span>
                )}
              </div>
            </div>

            {/* ngày sinh */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <span className="text-muted-foreground col-span-1">
                Ngày sinh
              </span>
              <div className="col-span-2">
                {isEditing ? (
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    className="w-full border rounded px-2 py-1 outline-none focus:border-blue-500"
                  />
                ) : (
                  <span className="text-foreground font-medium">
                    {formatDate(user.birthday) || "Chưa cập nhật"}
                  </span>
                )}
              </div>
            </div>

            {/* điện thoại */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <span className="text-muted-foreground col-span-1">
                Điện Thoại
              </span>
              <div className="col-span-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    className="w-full border rounded px-2 py-1 outline-none focus:border-blue-500"
                  />
                ) : (
                  <span className="text-foreground font-medium">
                    {user.phone || "Chưa cập nhật"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/*  FOOTER  */}
        <div className="p-4 pt-0 border-t-0">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="cursor-pointer w-full flex items-center justify-center gap-2 bg-background border border-gray-300 hover:bg-blue-300 text-foreground font-medium py-2 rounded-md transition-colors"
            >
              <Pencil size={16} />
              Cập nhật
            </button>
          ) : (
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={handleCancel}
                className="cursor-pointer flex items-center gap-2  p-2 font-medium bg-background rounded text-foreground hover:bg-blue-300"
              >
                <RotateCcw size={14} />
                Hủy
              </button>

              <button
                onClick={handleProfile}
                disabled={loadingProfile || !checkData}
                className={`flex items-center gap-2 p-2 font-medium rounded
                  ${
                    loadingProfile || !checkData
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-300 cursor-pointer"
                  }`}
              >
                {loadingProfile ? (
                  <Spinner className="size-4 text-primary-foreground" />
                ) : (
                  <Save size={16} />
                )}
                Lưu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
