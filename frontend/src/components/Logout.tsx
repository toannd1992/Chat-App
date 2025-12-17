import { LogOut } from "lucide-react";

import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";

const Logout = () => {
  const { signOutStore } = useAuthStore();
  const nagivate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOutStore();
      nagivate("/signin");
    } catch (error) {
      console.error("Lỗi khi đăng xuất", error);
    }
  };
  return (
    <div onClick={handleLogout} className="p-2 w-full flex gap-3">
      <LogOut />
      Đăng Xuất
    </div>
  );
};

export default Logout;
