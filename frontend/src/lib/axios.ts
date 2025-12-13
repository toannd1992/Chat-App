import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// gắn accessToken vào req header
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
export default api;

// tự động gọi refresh để lấy accessToken khi hết hạn

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    // bỏ qua những api k cần check lỗi
    if (
      originalRequest.url.includes("/auth/signin") ||
      originalRequest.url.includes("/auth/signup") ||
      originalRequest.url.includes("/auth/refresh")
    ) {
      return Promise.reject(error); // bỏ qua và trả về lỗi
    }
    // nếu lỗi 403 thì gọi refresh
    if (error.response?.status === 403) {
      const { refreshStore, clearState } = useAuthStore.getState();
      try {
        await refreshStore();

        // lấy accessToken mới trong store
        const { accessToken } = useAuthStore.getState();
        // gán vào hearder
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (error) {
        clearState();
        return Promise.reject(error);
      }
    }
    // không phải lỗi 403 thì trả về các lỗi khác
    return Promise.reject(error);
  }
);
