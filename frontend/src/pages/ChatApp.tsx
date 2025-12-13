import BodyMessage from "@/components/MessageChat/BodyMessage";
import HeaderMessage from "@/components/MessageChat/HeaderMessage";

import { AppSidebar } from "@/components/sidebar/app-sidebar";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const ChatApp = () => {
  return (
    <SidebarProvider className="w-full h-screen overflow-hidden  pb-2">
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full overflow-hidden">
        {/* header */}
        <header className="flex h-18 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <HeaderMessage />
          </div>
        </header>
        {/* body chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <BodyMessage />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ChatApp;
