import Welcome from "@/chat/Welcome";
import BodyMessage from "@/components/MessageChat/BodyMessage";
import HeaderMessage from "@/components/MessageChat/HeaderMessage";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar, // Import hook này
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useChatStore } from "@/stores/useChatStore";
import { Ellipsis } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
const ChatLayout = () => {
  const { activeConversationId, conversations, deleteConversation } =
    useChatStore();
  const { user } = useAuthStore();
  const [type, setType] = useState<
    "delete_convo" | "delete_group" | "leave_group" | null
  >(null);
  const { isMobile, setOpenMobile } = useSidebar(); // hook của shadcn

  useEffect(() => {
    if (isMobile) {
      // nếu không có tin nhắn nào được chọn thì mở sidebar lên
      if (!activeConversationId) {
        setOpenMobile(true);
      } else {
        //  chọn tin nhắn đóng sidebar hiển thị inset
        setOpenMobile(false);
      }
    }
  }, [isMobile, activeConversationId, setOpenMobile]);

  const convo = conversations.find((c) => c._id === activeConversationId);

  const handleAction = () => {
    if (type) {
      deleteConversation(activeConversationId!, type);
    }

    setType(null);
  };
  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full overflow-hidden ">
        {/* header */}
        <header className="flex h-18 shrink-0 items-center gap-2 justify-between">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <HeaderMessage />
          </div>
          <div className="mr-5">
            {convo && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="completedGhost"
                    size="icon-sm"
                    className="cursor-pointer rounded hover:bg-muted-foreground/10 p-1"
                  >
                    <Ellipsis className=" p-1 size-6 text-muted-foreground rounded cursor-pointer hover:bg-muted-foreground/30" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-35" align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer">
                      Ghim hội thoại
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      Ẩn trò chuyện
                    </DropdownMenuItem>
                    {/* xóa hội thoại */}
                    {convo.type === "direct" ? (
                      <DropdownMenuItem
                        onClick={() => {
                          setType("delete_convo");
                        }}
                        className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                      >
                        Xóa hội thoại
                      </DropdownMenuItem>
                    ) : convo.group?.createdBy === user?._id ? (
                      <DropdownMenuItem
                        onClick={() => {
                          setType("delete_group");
                        }}
                        className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                      >
                        Xóa nhóm
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => {
                          setType("leave_group");
                        }}
                        className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                      >
                        Rời nhóm
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <AlertDialog open={!!type} onOpenChange={() => setType(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {type === "leave_group" ? "Rời nhóm" : "Xác nhận xóa"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {type === "leave_group"
                      ? "Bạn sẽ không thể xem lại tin nhắn trong nhóm này sau khi rời nhóm?"
                      : "Toàn bộ nội dung cuộc trò chuyện sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="hover:bg-muted cursor-pointer rounded">
                    Hủy
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAction}
                    className="text-white bg-destructive/50 hover:bg-destructive cursor-pointer rounded"
                  >
                    {type === "leave_group" ? "Rời nhóm" : "Xóa"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
        {/* body chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeConversationId ? <BodyMessage /> : <Welcome />}
        </div>
      </SidebarInset>
    </>
  );
};

export default ChatLayout;
