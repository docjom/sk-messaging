import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";

export function ChatSidebar({
  chats,
  selectedChatId,
  onChatSelect,
  clearTopicId,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) return chats;
    return chats.filter((chat) => {
      const name = chat.name || "";
      const lastMessage = chat.lastMessage || "";
      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [chats, searchTerm]);

  return (
    <>
      {/* Header */}
      <div className="px-3 py-2 sm:px-4 sm:py-3.5 border-b dark:bg-gray-900 border-border">
        {/* Search */}
        <div className="relative border border-border bg-inherit  rounded-lg">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 sm:pl-9 bg-input-background border-0 h-9 sm:h-10"
          />
        </div>
      </div>

      <div className="h-full overflow-y-auto bg-card border-r border-border flex flex-col">
        {/* Chat List */}
        <div className="flex-1">
          <div className="p-1 sm:p-2 w-full">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    onChatSelect(chat.id);
                    clearTopicId(chat.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent",
                    selectedChatId === chat.id && "bg-accent"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                        {chat.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {chat.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 relative">
                    <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                      <h3 className="truncate font-medium text-sm sm:text-base lg:text-sm xl:text-base">
                        {chat.name}
                      </h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {chat.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate pr-2">
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="h-4 min-w-4 sm:h-5 sm:min-w-5 text-xs flex-shrink-0"
                        >
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center text-sm mt-4">
                No chats found
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
