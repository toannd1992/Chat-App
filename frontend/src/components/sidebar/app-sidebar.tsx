"use client";

import { Moon, Sun } from "lucide-react";

import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Switch } from "@/components/ui/switch";
import NavChat from "@/chat/NavChat";

import GroupChatList from "@/chat/GroupChatList";

import FriendList from "@/chat/FriendList";
import { useThemeStore } from "@/stores/useThemeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useEffect } from "react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {
    isDark,
    toggleTheme,

    setListFriend,
    setCreateGroup,
  } = useThemeStore();
  const { user } = useAuthStore();
  const { activeConversationId } = useChatStore();

  useEffect(() => {}, [activeConversationId]);
  const handleIsOpenListFriend = () => {
    setListFriend(true);
  };

  const handleIsOpenCreateGroup = () => {
    setCreateGroup(true);
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-col gap-3">
            <SidebarMenuButton
              size="lg"
              asChild
              className="bg-gradient-primary "
            >
              <a href="#">
                <div className="flex w-full items-center px-2 justify-between">
                  <h1 className="text-xl font-bold text-white">Chat App</h1>
                  <div className="flex items-center gap-2">
                    <Sun className="size-4 text-white/80" />
                    <Switch
                      checked={isDark}
                      onCheckedChange={toggleTheme}
                      className="data-[state=checked]:bg-background/80 cursor-pointer"
                    />
                    <Moon className="size-4 text-white/80" />
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
            <NavChat />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="beautiful-scrollbar">
        {/* group chat */}
        <SidebarGroup>
          <SidebarGroupLabel>Nhóm</SidebarGroupLabel>
          <SidebarGroupAction
            onClick={handleIsOpenCreateGroup}
            title="Tạo Nhóm"
            className="cursor-pointer"
          >
            +
          </SidebarGroupAction>
          <SidebarGroupContent className="max-h-41 overflow-hidden overflow-y-auto beautiful-scrollbar">
            <GroupChatList />
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Bạn bè */}
        <SidebarGroup>
          <SidebarGroupLabel>Bạn bè</SidebarGroupLabel>
          <SidebarGroupAction
            onClick={handleIsOpenListFriend}
            title="Bạn bè"
            className="cursor-pointer "
          >
            +
          </SidebarGroupAction>
          <SidebarGroupContent className="max-h-70 overflow-hidden overflow-y-auto beautiful-scrollbar">
            <FriendList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
