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
import CreateNewChat from "@/chat/CreateNewChat";
import NewGroupChat from "@/chat/NewGroupChat";
import GroupChatList from "@/chat/GroupChatList";
import AddFriend from "@/chat/AddFriend";
import FriendList from "@/chat/FriendList";
import { useThemeStore } from "@/stores/useThemeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useEffect } from "react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { activeConversationId } = useChatStore();

  useEffect(() => {}, [activeConversationId]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="bg-gradient-primary"
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="beautiful-scrollbar">
        {/* new chat */}
        <SidebarGroup>
          <SidebarGroupContent>
            <CreateNewChat />
          </SidebarGroupContent>
        </SidebarGroup>
        {/* group chat */}
        <SidebarGroup>
          <SidebarGroupLabel>Nhóm</SidebarGroupLabel>
          <SidebarGroupAction title="Tạo Nhóm" className="cursor-pointer">
            <NewGroupChat />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <GroupChatList />
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Bạn bè */}
        <SidebarGroup>
          <SidebarGroupLabel>Bạn bè</SidebarGroupLabel>
          <SidebarGroupAction title="Bạn bè" className="cursor-pointer">
            <AddFriend />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <FriendList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
