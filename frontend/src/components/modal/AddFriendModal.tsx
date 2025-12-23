"use client";

import { useState, useEffect } from "react"; // Thêm useEffect để reset khi mở lại modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UserPlus, Mail, Search } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import type { typeUser } from "@/types/typeUser";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFriendStore } from "@/stores/useFriendStore";
import { Separator } from "../ui/separator";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFriendModal = ({ isOpen, onClose }: AddFriendModalProps) => {
  // chỉ lấy hàm seachUser, tránh render lại khi store thay đổi dữ liệu khác
  const seachUser = useAuthStore((state) => state.seachUser);

  const currentUser = useAuthStore((state) => state.user); //user hiện tại
  const {
    requestFrom,
    requestTo,
    acceptFriend,
    declineFriend,
    setRequest,
    cancelFriend,
    sendFriend,
    getFriendRequests,
  } = useFriendStore();
  const [tab, setTab] = useState("search");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [userResult, setUserResult] = useState<typeUser | null>(null);

  const [hasSearched, setHasSearched] = useState(false); //  bấm tìm hay chưa

  // Reset state mỗi khi mở lại Modal

  useEffect(() => {
    if (isOpen) {
      setKeyword("");
      setUserResult(null);
      setHasSearched(false);
      handleFriendRequets();
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    // reset kết quả cũ trước khi tìm mới
    setUserResult(null);
    setHasSearched(true);
    setLoading(true);

    try {
      const res = await seachUser(keyword);

      if (res && res._id) {
        setUserResult(res); // luu kết quả
        setKeyword("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!userResult) return;

    const message = "kết bạn với mình nhé";
    try {
      await sendFriend(userResult._id, message);
      setUserResult(null);
      setKeyword("");
      setHasSearched(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFriendRequets = async () => {
    try {
      await getFriendRequests();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAcceptFriend = async (id: string) => {
    try {
      await acceptFriend(id);

      onClose();
    } catch (error) {
      console.error(error);
    }
  };
  const handleDeclineFriend = async (id: string) => {
    try {
      await declineFriend(id);
    } catch (error) {
      console.error(error);
    }
  };

  // thu hồi lời mời hết bạn
  const handleCancelFriend = async (id: string) => {
    try {
      await cancelFriend(id);
      setRequest(id);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm min-h-[400px] rounded-2xl bg-background">
        <DialogHeader className="h-5">
          <DialogTitle className="text-center">Thêm bạn bè</DialogTitle>

          <DialogDescription />
          <Separator />
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full rounded mt-4">
            <TabsTrigger value="search" className="rounded cursor-pointer">
              Tìm bạn
            </TabsTrigger>
            <TabsTrigger value="request" className="rounded cursor-pointer">
              Lời mời ({requestTo.length})
            </TabsTrigger>
          </TabsList>

          {/* Seach */}
          <TabsContent value="search" className="space-y-4 pt-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Nhập email để tìm kiếm..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="rounded pr-8 dark:shadow-white/20"
                />
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <Button
                variant="ghost"
                className="rounded hover:bg-muted cursor-pointer shrink-0"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tìm"}
              </Button>
            </div>
            <div className="space-y-3">
              {userResult ? (
                <div className="flex w-full items-center justify-between ">
                  <Card className="p-2 flex-row items-center justify-between  shadow-sm border w-full">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage
                          src={userResult.avatarUrl}
                          alt={userResult.displayName}
                        />
                        <AvatarFallback>
                          {userResult.displayName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold truncate max-w-[120px]">
                          {userResult.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {userResult.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end"></div>
                    {currentUser?._id !== userResult._id &&
                      (userResult.friend ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled
                          className="rounded text-xs h-8 px-3 hover:bg-blue-100 "
                        >
                          Đã là bạn bè
                        </Button>
                      ) : userResult.request ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled
                          className=" rounded text-xs h-8 px-3  hover:bg-blue-100 "
                        >
                          Đã có lời mời đang chờ chấp nhận
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className=" rounded text-xs h-8 px-3 cursor-pointer hover:bg-blue-100 "
                          onClick={handleAddFriend}
                        >
                          <UserPlus size={16} className="mr-1" />
                          Kết bạn
                        </Button>
                      ))}
                  </Card>
                </div>
              ) : (
                // trạng thái trống hoặc không tìm thấy
                !loading &&
                hasSearched && (
                  <div className="flex flex-col items-center justify-center pt-8 text-muted-foreground opacity-70">
                    <p className="text-sm">Không tìm thấy người dùng</p>
                  </div>
                )
              )}
            </div>
            <ScrollArea className="h-60 pr-2">
              <div className="text-xs text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0">
                {`Lời mời đã gửi (${requestFrom.length})`}
              </div>
              <div className="space-y-3">
                {requestFrom && requestFrom.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {requestFrom.map((f) => (
                      <Card
                        key={f._id}
                        className="p-1 flex-row rounded w-full items-center  justify-between  shadow-sm border "
                      >
                        <div className="flex   gap-2 overflow-hidden">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage
                              src={f.to.avatarUrl}
                              alt={f.to.displayName}
                            />
                            <AvatarFallback>
                              {f.to.displayName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold truncate max-w-[120px]">
                              {f.to.displayName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {f.message}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <Button
                            size="sm"
                            variant="destructive"
                            className=" rounded text-xs h-8 px-3 cursor-pointer "
                            onClick={() => handleCancelFriend(f._id)}
                          >
                            Thu hồi lời mời
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* LỜI MỜI */}
          <TabsContent value="request">
            <div className="flex flex-col items-center justify-center h-77 text-muted-foreground pt-2">
              <ScrollArea className="w-full h-77 pr-2">
                <div className="text-xs text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0">
                  {`Lời mời đã nhận (${requestTo.length})`}
                </div>
                <div className="space-y-3">
                  {requestTo && requestTo.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {requestTo.map((f) => (
                        <Card
                          key={f._id}
                          className="p-1 flex-row rounded w-full items-center  justify-between  shadow-sm border "
                        >
                          <div className="flex   gap-2 overflow-hidden">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage
                                src={f.from.avatarUrl}
                                alt={f.from.displayName}
                              />
                              <AvatarFallback>
                                {f.from.displayName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-semibold truncate max-w-[120px]">
                                {f.from.displayName}
                              </span>
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {f.message}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <Button
                              size="sm"
                              variant="destructive"
                              className=" rounded text-xs h-8 px-3 cursor-pointer "
                              onClick={() => handleDeclineFriend(f._id)}
                            >
                              Từ Chối
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className=" rounded text-xs h-8 px-3 cursor-pointer hover:bg-blue-100 "
                              onClick={() => handleAcceptFriend(f._id)}
                            >
                              Đồng ý
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    // Trạng thái trống hoặc không tìm thấy
                    !requestFrom &&
                    !requestTo && (
                      <div className="flex flex-col items-center justify-center pt-8 text-muted-foreground opacity-70">
                        <Mail className="mb-2 h-10 w-10 opacity-20" />
                        <p className="text-sm">Chưa có lời mời nào</p>
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;
