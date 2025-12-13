import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";

import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const { accessToken, user, loading, fetchMeStore, refreshStore } =
    useAuthStore();
  const [isStarting, setIsStarting] = useState(true);

  // khi người dùng refresh lại trang thì store cũng reset
  useEffect(() => {
    const init = async () => {
      //kiểm tra và lấy lại dữ liệu khi store bị reset
      if (!accessToken) {
        await refreshStore(); // nếu k có accestoken thì gọi hàm refresh để tạo lại accesstoken
      }

      if (accessToken && !user) {
        await fetchMeStore(); // nếu có accestoken  và k có user thì gọi hàm fetch để lấy user
      }
      setIsStarting(false);
    };
    init();
  }, []);

  if (isStarting || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Đang tải trang....
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
