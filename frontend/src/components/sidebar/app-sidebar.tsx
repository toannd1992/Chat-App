"use client";

import { Moon, Sun } from "lucide-react";

import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ChatList from "@/chat/ChatList";
import { nameProject } from "../../lib/utils.ts";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [tab, setTab] = useState("all");
  const { isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { activeConversationId } = useChatStore();

  useEffect(() => {}, [activeConversationId]);

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
                  <h1 className="text-2xl font-bold text-white">
                    {nameProject}
                  </h1>
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
      <SidebarContent className="overflow-hidden ">
        {/* tab */}
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="w-full h-full min-h-0"
        >
          <TabsList className="bg-transparent">
            <TabsTrigger
              value="all"
              className="data-[state=active]:text-sidebar-foreground cursor-pointer data-[state=active]:shadow-none data-[state=active]:underline data-[state=active]:underline-offset-4  text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded
               px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear 
        "
            >
              Tất Cả
            </TabsTrigger>
            <TabsTrigger
              value="group"
              className="cursor-pointer data-[state=active]:shadow-none data-[state=active]:underline data-[state=active]:underline-offset-4 data-[state=active]:text-sidebar-foreground text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded
               px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear 
        "
            >
              Nhóm
            </TabsTrigger>
            <TabsTrigger
              value="direct"
              className="data-[state=active]:text-sidebar-foreground cursor-pointer data-[state=active]:shadow-none data-[state=active]:underline data-[state=active]:underline-offset-4 text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear 
        "
            >
              Bạn bè
            </TabsTrigger>
          </TabsList>
          {/* All */}
          <TabsContent
            value="all"
            className="h-full flex-1 flex flex-col min-h-0"
          >
            <SidebarGroup className="min-h-0">
              <SidebarGroupContent className="h-full overflow-y-auto beautiful-scrollbar [scrollbar-gutter:stable]">
                <ChatList />
              </SidebarGroupContent>
            </SidebarGroup>
          </TabsContent>
          {/* group */}
          <TabsContent
            value="group"
            className="h-full flex-1 flex flex-col min-h-0"
          >
            <SidebarGroup className="min-h-0">
              <SidebarGroupContent className="h-full overflow-y-auto beautiful-scrollbar [scrollbar-gutter:stable]">
                <GroupChatList />
              </SidebarGroupContent>
            </SidebarGroup>
          </TabsContent>

          {/* direct */}
          <TabsContent
            value="direct"
            className="h-full flex-1 flex flex-col min-h-0"
          >
            <SidebarGroup className="relative min-h-0">
              <SidebarGroupContent className="h-full overflow-y-auto beautiful-scrollbar [scrollbar-gutter:stable]">
                <FriendList />
              </SidebarGroupContent>
            </SidebarGroup>
          </TabsContent>
        </Tabs>

        {/* Bạn bè */}
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
