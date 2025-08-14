import React, { useCallback, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { LeaveGroup } from "../group/LeaveGroup";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../firebase";
import { useMessageActionStore } from "../../stores/useMessageActionStore";
import { formatTimestamp } from "../../composables/scripts";
import { Check, CheckCheck, ChevronDown, Pin, Users, Hash } from "lucide-react";

// Memoized Chat Card Component for better performance
const ChatCard = React.memo(
  ({
    chat,
    isSelected,
    isPinned,
    isRead,
    onSelectChat,
    onPin,
    onUnpin,
    onMarkRead,
    onMarkUnread,
    getChatPhoto,
    getChatDisplayName,
    getOtherUserInDirectChat,
    currentUserId,
    clearCurrentChat,
  }) => {
    const handleChatClick = useCallback(() => {
      onSelectChat(chat);
    }, [chat, onSelectChat]);

    const handlePinClick = useCallback(
      (e) => {
        e.stopPropagation();
        if (isPinned) {
          onUnpin(chat.id);
        } else {
          onPin(chat.id);
        }
      },
      [chat.id, isPinned, onPin, onUnpin]
    );

    const handleReadClick = useCallback(
      (e) => {
        e.stopPropagation();
        if (isRead) {
          onMarkUnread(chat.id);
        } else {
          onMarkRead(chat.id);
        }
      },
      [chat.id, isRead, onMarkRead, onMarkUnread]
    );

    const stopPropagation = useCallback((e) => {
      e.stopPropagation();
    }, []);

    const otherUser =
      chat.type === "direct" ? getOtherUserInDirectChat(chat) : null;

    return (
      <div
        onClick={handleChatClick}
        className={`
        group relative cursor-pointer transition-all duration-200 ease-in-out
        border-b border-gray-100 dark:border-gray-800 last:border-b-0
        hover:bg-gray-50 dark:hover:bg-gray-800/50
        ${
          isSelected
            ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
            : ""
        }
        ${isPinned ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}
      `}
      >
        {/* Menu Button - Telegram style */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Popover>
            <PopoverTrigger
              onClick={stopPropagation}
              className="p-1.5 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronDown
                size={12}
                className="text-gray-600 dark:text-gray-300"
              />
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="end">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8"
                onClick={handlePinClick}
              >
                <Pin size={16} />
                {isPinned ? "Unpin chat" : "Pin chat"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8"
                onClick={handleReadClick}
              >
                {isRead ? <Check size={16} /> : <CheckCheck size={16} />}
                {isRead ? "Mark as unread" : "Mark as read"}
              </Button>

              {chat.type === "group" && (
                <div onClick={stopPropagation}>
                  <LeaveGroup
                    chatId={chat.id}
                    currentUserId={currentUserId}
                    onLeaveSuccess={clearCurrentChat}
                  />
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center p-3 gap-3">
          {/* Avatar Section */}
          <div className="relative flex-shrink-0">
            {/* Online status for direct chats */}
            {chat.type === "direct" && otherUser?.active && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full z-10" />
            )}

            <Avatar
              className={`w-12 h-12 transition-all duration-200 ${
                chat.hasChatTopic ? "rounded-xl" : "rounded-full"
              }`}
            >
              <AvatarImage src={getChatPhoto(chat)} className="object-cover" />
              <AvatarFallback
                className={`
                bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium
                ${chat.hasChatTopic ? "rounded-xl" : "rounded-full"}
              `}
              >
                {getChatDisplayName(chat)?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Chat Type Icon */}
                {chat.type === "group" && (
                  <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                    {chat.hasChatTopic ? (
                      <Hash size={16} />
                    ) : (
                      <Users size={16} />
                    )}
                  </div>
                )}

                {/* Chat Name */}
                <h3
                  className={`
                text-sm font-medium truncate
                ${
                  !isRead
                    ? "text-gray-900 dark:text-white font-semibold"
                    : "text-gray-700 dark:text-gray-300"
                }
              `}
                >
                  {getChatDisplayName(chat)}
                </h3>

                {/* Pin indicator */}
                {isPinned && (
                  <div className="flex-shrink-0 text-blue-500">
                    <Pin size={12} />
                  </div>
                )}
              </div>

              {/* Time and Status */}
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {/* Read status */}
                {isRead && <CheckCheck size={12} className="text-green-500" />}

                {/* Timestamp */}
                {chat.lastMessageTime && (
                  <span
                    className={`
                  text-xs
                  ${
                    !isRead
                      ? "text-blue-600 dark:text-blue-400 font-medium"
                      : "text-gray-500 dark:text-gray-400"
                  }
                `}
                  >
                    {formatTimestamp(chat.lastMessageTime)}
                  </span>
                )}
              </div>
            </div>

            {/* Topics Row (if applicable) */}
            {chat.hasChatTopic && chat.topicNameList && (
              <div className="flex flex-wrap gap-1 mb-1">
                {chat.topicNameList.slice(0, 2).map((topic, index) => (
                  <span
                    key={`${chat.id}-topic-${index}`}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    {topic}
                  </span>
                ))}
                {chat.topicNameList.length > 2 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{chat.topicNameList.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Last Message Row */}
            {chat.lastMessage && (
              <div className="flex items-center justify-between">
                <p
                  className={`
                text-sm truncate flex-1
                ${
                  !isRead
                    ? "text-gray-900 dark:text-gray-200 font-medium"
                    : "text-gray-500 dark:text-gray-400"
                }
              `}
                >
                  {chat.lastMessage}
                </p>

                {/* Unread indicator */}
                {!isRead && (
                  <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ChatCard.displayName = "ChatCard";

const ChatList = ({
  filteredChats,
  handleSelectChat,
  getOtherUserInDirectChat,
  getChatPhoto,
  getChatDisplayName,
  currentUserId,
  clearCurrentChat,
}) => {
  const { chatId } = useMessageActionStore();

  // Memoized action handlers
  const markAsRead = useCallback(
    async (chatId) => {
      try {
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
          seenBy: arrayUnion(currentUserId),
        });
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    },
    [currentUserId]
  );

  const markAsUnread = useCallback(
    async (chatId) => {
      try {
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
          seenBy: arrayRemove(currentUserId),
        });
      } catch (error) {
        console.error("Error marking as unread:", error);
      }
    },
    [currentUserId]
  );

  const pinChat = useCallback(
    async (chatId) => {
      try {
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
          pin: arrayUnion(currentUserId),
        });
      } catch (error) {
        console.error("Error pinning chat:", error);
      }
    },
    [currentUserId]
  );

  const unpinChat = useCallback(
    async (chatId) => {
      try {
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
          pin: arrayRemove(currentUserId),
        });
      } catch (error) {
        console.error("Error unpinning chat:", error);
      }
    },
    [currentUserId]
  );

  // Memoized chat categorization and sorting
  const { pinnedChats, unpinnedChats } = useMemo(() => {
    const pinned = [];
    const unpinned = [];

    filteredChats.forEach((chat) => {
      if (chat.pin?.includes(currentUserId)) {
        pinned.push(chat);
      } else {
        unpinned.push(chat);
      }
    });

    // Sort by last message time (most recent first)
    const sortByTime = (a, b) => {
      const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
      const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
      return timeB - timeA;
    };

    pinned.sort(sortByTime);
    unpinned.sort(sortByTime);

    return { pinnedChats: pinned, unpinnedChats: unpinned };
  }, [filteredChats, currentUserId]);

  const renderChats = useCallback(
    (chats, showPinnedHeader = false) => {
      if (chats.length === 0) return null;

      return (
        <div className="w-full">
          {showPinnedHeader && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Pin size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Pinned Chats
                </span>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {chats.map((chat) => (
              <ChatCard
                key={chat.id}
                chat={chat}
                isSelected={chatId === chat.id}
                isPinned={chat.pin?.includes(currentUserId)}
                isRead={chat.seenBy?.includes(currentUserId)}
                onSelectChat={handleSelectChat}
                onPin={pinChat}
                onUnpin={unpinChat}
                onMarkRead={markAsRead}
                onMarkUnread={markAsUnread}
                getChatPhoto={getChatPhoto}
                getChatDisplayName={getChatDisplayName}
                getOtherUserInDirectChat={getOtherUserInDirectChat}
                currentUserId={currentUserId}
                clearCurrentChat={clearCurrentChat}
              />
            ))}
          </div>
        </div>
      );
    },
    [
      chatId,
      currentUserId,
      handleSelectChat,
      pinChat,
      unpinChat,
      markAsRead,
      markAsUnread,
      getChatPhoto,
      getChatDisplayName,
      getOtherUserInDirectChat,
      clearCurrentChat,
    ]
  );

  return (
    <div className="w-full h-full overflow-hidden">
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {/* Pinned Chats */}
        {pinnedChats.length > 0 && renderChats(pinnedChats, true)}

        {/* Regular Chats */}
        {unpinnedChats.length > 0 && renderChats(unpinnedChats, false)}

        {/* Empty State */}
        {pinnedChats.length === 0 && unpinnedChats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Icon icon="mdi:chat-outline" className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No chats found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start a conversation to see your chats here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ChatList);
