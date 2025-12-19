import { Bell, ChevronsUpDown, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Logout from "../Logout";
import type { typeUser } from "@/types/typeUser";
import { useThemeStore } from "@/stores/useThemeStore";

export function NavUser({ user }: { user: typeUser }) {
  const { isMobile } = useSidebar();
  const bgColor = !user.avatarUrl ? "bg-blue-500" : "";
  const { setProfile } = useThemeStore();

  const handleIsOpen = () => {
    const isOpen = true;
    setProfile(isOpen);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback
                  className={`${bgColor} text-white font-semibold`}
                >
                  {user.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.displayName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                  <AvatarFallback
                    className={`${bgColor} text-white font-semibold`}
                  >
                    {user.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.displayName}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-1 p-1">
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-muted-foreground hover:bg-muted"
                onClick={handleIsOpen} // Mở Modal khi click
              >
                <User size={15} className="text-muted-foreground" />
                Tài Khoản
              </DropdownMenuItem>

              <DropdownMenuItem className="gap-2 cursor-pointer text-muted-foreground hover:bg-muted">
                <Bell size={15} className="text-muted-foreground" />
                Thông báo
              </DropdownMenuItem>

              <DropdownMenuItem className="gap-2 cursor-pointer text-muted-foreground hover:bg-muted">
                <Settings size={15} className="text-muted-foreground" />
                Cài đặt
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer p-1"
              variant="destructive"
            >
              <Logout />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
