import ChatLayout from "@/chat/ChatLayout";
import AddFriendModal from "@/components/modal/AddFriendModal";
import CreateGroupModal from "@/components/modal/CreateGroupModal";
import ListFriendModel from "@/components/modal/ListFriendModel";
import UserProfileModal from "@/components/modal/UserProfileModal";

import { SidebarProvider } from "@/components/ui/sidebar";

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
      <ChatLayout />
      {/* model */}
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
