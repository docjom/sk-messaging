import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Users, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { useUserStore } from "@/stores/useUserStore";
import { useFolderStore } from "@/stores/chat-folder/useFolderStore";

const FolderChatsDialog = ({ isOpen, onOpenChange, folder, onRemoveChat }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRemoving, setIsRemoving] = useState(null);

  const { chats, users } = useMessageActionStore();
  const user = useUserStore((s) => s?.user);
  const { folders } = useFolderStore();

  const liveFolder = folders.find((f) => f.id === folder?.id) || folder;

  const getChatPhoto = useCallback(
    (chat) => {
      if (chat.type === "direct") {
        const otherUserId = chat.users.find((uid) => uid !== user?.uid);
        const otherUser = users.find((u) => u.id === otherUserId);
        return otherUser?.photoURL;
      }
      return chat.photoURL;
    },
    [user?.uid, users]
  );

  const getChatIcon = (type) => {
    switch (type) {
      case "private":
        return <Users className="h-4 w-4 text-gray-500" />;
      case "group":
        return <Users className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFolderChats = () => {
    if (!liveFolder?.chatIds) return [];

    return chats
      .filter((chat) => liveFolder.chatIds.includes(chat.id))
      .filter((chat) =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const handleRemoveChat = async (chatId) => {
    if (!onRemoveChat || !liveFolder) return;

    setIsRemoving(chatId);
    try {
      await onRemoveChat(liveFolder.id, chatId);
    } catch (error) {
      console.error("Error removing chat:", error);
    } finally {
      setIsRemoving(null);
    }
  };

  const folderChats = getFolderChats();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <span>Chats in "{liveFolder?.folderName}"</span>
            <Badge variant="secondary" className="ml-2">
              {folderChats.length} chat{folderChats.length !== 1 ? "s" : ""}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Search */}
          <div className="relative mb-4 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats in this folder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Chats List */}
          <div className="flex-1 overflow-y-auto">
            {folderChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium mb-1">
                  {searchTerm ? "No chats found" : "No chats in this folder"}
                </p>
                <p className="text-sm text-gray-400">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Add some chats to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {folderChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 mr-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getChatPhoto(chat)} />
                        <AvatarFallback className="text-sm font-medium">
                          {chat.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {chat.name}
                        </h4>
                        {getChatIcon(chat.type)}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {chat.lastMessage || "No recent messages"}
                      </p>
                    </div>

                    {/* Remove Button */}
                    {!liveFolder?.isDefault && (
                      <div className="flex-shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveChat(chat.id)}
                          disabled={isRemoving === chat.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
                          {isRemoving === chat.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FolderChatsDialog;
