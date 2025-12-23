import type { ThemeState } from "@/types/typeStore";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isOpenProfile: false,
      isOpenAddFriend: false,
      isOpenCreateGroup: false,
      isOpenListFriend: false,
      isDark: false,
      clearState: () => {
        set({
          isOpenProfile: false,
          isOpenAddFriend: false,
          isOpenCreateGroup: false,
          isOpenListFriend: false,
        });
      },
      toggleTheme: () => {
        const newValue = !get().isDark;
        set({ isDark: newValue });
        if (newValue) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
      setTheme: (dark: boolean) => {
        set({ isDark: dark });
        if (dark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
      setProfile: (isOpen: boolean) => {
        set({ isOpenProfile: isOpen });
      },
      setAddFriend: (isOpen: boolean) => {
        set({ isOpenAddFriend: isOpen });
      },
      setCreateGroup: (isOpen: boolean) => {
        set({ isOpenCreateGroup: isOpen });
      },
      setListFriend: (isOpen: boolean) => {
        set({ isOpenListFriend: isOpen });
      },
    }),
    {
      name: "theme-storage",
    }
  )
);
