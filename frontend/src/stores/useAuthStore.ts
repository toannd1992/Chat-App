import { create } from "zustand";
import { toast } from "sonner";
import type { typeStore } from "@/types/typeStore";
import { authServices } from "@/services/authServices";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";
import { useFriendStore } from "./useFriendStore";
import { useThemeStore } from "./useThemeStore";

export const useAuthStore = create<typeStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,

      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        localStorage.clear(); // xóa localStorage
        useChatStore.getState().reset(); //reset chatStore
      },

      signUpStore: async (fistname, lastname, email, password) => {
        try {
          set({ loading: true });
          // gọi API
          const res = await authServices.signUp(
            fistname,
            lastname,
            email,
            password
          );

          toast.success("Đăng ký tài khoản thành công, vui lòng đăng nhập");
          return res;
        } catch (error) {
          console.error("Lỗi khi signup", error);
          toast.error("Tạo tài khoản thất bại, vui lòng thử lại");
        } finally {
          set({ loading: false });
        }
      },

      signInStore: async (email, password) => {
        try {
          set({ loading: true });
          localStorage.clear(); // xóa localStorage khi đăng nhập
          useChatStore.getState().reset(); //reset chatStore
          useFriendStore.getState().reset();
          useThemeStore.getState().clearState();

          const { accessToken, message } = await authServices.signIn(
            email,
            password
          );

          set({ accessToken: accessToken });
          await get().fetchMeStore();
          useChatStore.getState().fetchConversations(); // lấy thông tin conversation
          useFriendStore.getState().getFriendRequests();

          toast.success(message);
          return message;
        } catch (error) {
          console.error("Lỗi khi đăng nhập", error);
          toast.error("Tài khoản hoặc mật khẩu không đúng!");
        } finally {
          set({ loading: false });
        }
      },

      signOutStore: async () => {
        try {
          get().clearState();
          await authServices.signOut();
          toast.success("Đăng xuất thành công");
        } catch (error) {
          console.error("Lỗi khi đăng xuất", error);
          toast.error("Đăng xuất thất bại, vui lòng thử lại");
        }
      },

      fetchMeStore: async () => {
        try {
          set({ loading: true });
          const res = await authServices.fetchMe();

          set({ user: res });
        } catch (error) {
          console.error("Lỗi khi lấy thông tin user", error);
          toast.error("Lấy thông tin thất bại, vui lòng thử lại");
        } finally {
          set({ loading: false });
        }
      },
      updateAvatar: async (avatar) => {
        try {
          const { user } = await authServices.updateAvatar(avatar);
          set({ user: user });
          toast.success("Cập nhật ảnh đại diện thành công");
        } catch (error) {
          console.error("Lỗi khi update avatar", error);
          toast.error("Lỗi cập nhật ảnh");
        }
      },
      updateProfile: async (data) => {
        try {
          const { user } = await authServices.updateProfile(data);
          set({ user: user });
        } catch (error) {
          console.error("Lỗi khi update profile", error);
          toast.error("Lỗi cập nhật thông tin cá nhân");
        }
      },
      seachUser: async (keyword) => {
        try {
          const userSearch = await authServices.seachUser(keyword);
          return userSearch;
        } catch (error) {
          console.error("Lỗi khi tìm kiếm user", error);
        }
      },
      refreshStore: async () => {
        try {
          set({ loading: true });
          const { user, fetchMeStore } = get(); // lấy user trong store

          const res = await authServices.refresh();
          set({ accessToken: res.accessToken });
          if (!user) {
            fetchMeStore(); // nếu k có user thì gọi hàm fetch để lấy lại thông tin
          }
        } catch (error) {
          console.error("Lỗi khi gọi refresh", error);
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
