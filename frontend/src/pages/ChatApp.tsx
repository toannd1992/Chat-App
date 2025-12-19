import BodyMessage from "@/components/MessageChat/BodyMessage";
import HeaderMessage from "@/components/MessageChat/HeaderMessage";
import AddFriendModal from "@/components/modal/AddFriendModal";
import CreateGroupModal from "@/components/modal/CreateGroupModal";
import ListFriendModel from "@/components/modal/ListFriendModel";
import UserProfileModal from "@/components/modal/UserProfileModal";

import { AppSidebar } from "@/components/sidebar/app-sidebar";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useThemeStore } from "@/stores/useThemeStore";

const ChatApp = () => {
  const {
    isOpenProfile,
    setProfile,
    isOpenAddFriend,
    setAddFriend,
    isOpenCreateGroup,
    setCreateGroup,
    setListFriend,
    isOpenListFriend,
  } = useThemeStore();
  return (
    <SidebarProvider className="w-full h-screen overflow-hidden  pb-2 relative">
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
      <UserProfileModal
        isOpen={isOpenProfile}
        onClose={() => setProfile(false)}
      />
      <AddFriendModal
        isOpen={isOpenAddFriend}
        onClose={() => setAddFriend(false)}
      />
      <CreateGroupModal
        isOpen={isOpenCreateGroup}
        onClose={() => setCreateGroup(false)}
      />
      <ListFriendModel
        isOpen={isOpenListFriend}
        onClose={() => setListFriend(false)}
      />
    </SidebarProvider>
  );
};

export default ChatApp;
