import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { LeaveGroup } from "./LeaveGroup";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";

export const ChatList = ({
  filteredChats,
  chatId,
  handleSelectChat,
  getOtherUserInDirectChat,
  getChatPhoto,
  getChatDisplayName,
  formatTimestamp,
  currentUserId,
  clearCurrentChat,
}) => {
  const markAsRead = async (chatId) => {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      seenBy: arrayUnion(currentUserId),
    });
  };

  const markAsUnread = async (chatId) => {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      seenBy: arrayRemove(currentUserId),
    });
  };

  const pinChat = async (chatId) => {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      pin: arrayUnion(currentUserId),
    });
  };

  const unpinChat = async (chatId) => {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      pin: arrayRemove(currentUserId),
    });
  };

  const pinnedChats = filteredChats.filter((chat) =>
    chat.pin?.includes(currentUserId)
  );
  const unpinnedChats = filteredChats.filter(
    (chat) => !chat.pin?.includes(currentUserId)
  );

  const ChatCard = ({ chat }) => {
    return (
      <div
        key={chat.id}
        onClick={() => handleSelectChat(chat)}
        className={`group cursor-pointer p-2 relative rounded-xl transition-colors
  ${
    chatId === chat.id
      ? "bg-blue-500/30 hover:bg-blue-500/40"
      : "hover:bg-gray-700"
  }
  ${
    chat.pin?.includes(currentUserId)
      ? "border bg-blue-500/5 my-0.5 border-gray-700"
      : ""
  }
`}
      >
        {chat.pin?.includes(currentUserId) && (
          <div className="absolute -top-1 left-2 text-red-500">
            <Icon icon="solar:pin-bold" width="14" height="14" />
          </div>
        )}

        <div className="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-150 backdrop-blur-sm">
          <Popover>
            <PopoverTrigger
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-1 border border-gray-500 m-0.5 rounded-full"
            >
              {" "}
              <Icon icon="uiw:down" width="12" height="12" />
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1">
              {!chat.pin?.includes(currentUserId) ? (
                <Button
                  variant="ghost"
                  className="w-full flex justify-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    pinChat(chat.id);
                  }}
                >
                  <Icon icon="solar:pin-bold" width="20" height="20" />
                  Pin chat {chat.pin?.includes(currentUserId)}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full flex justify-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    unpinChat(chat.id);
                  }}
                >
                  <Icon icon="solar:pin-line-duotone" width="20" height="20" />
                  Unpin chat
                </Button>
              )}
              {chat.seenBy?.includes(currentUserId) ? (
                <Button
                  variant="ghost"
                  className="w-full flex justify-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsUnread(chat.id);
                  }}
                >
                  <Icon
                    icon="solar:chat-unread-broken"
                    width="20"
                    height="20"
                  />
                  Mark as unread
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full flex justify-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(chat.id);
                  }}
                >
                  <Icon
                    icon="solar:chat-unread-bold-duotone"
                    width="20"
                    height="20"
                  />
                  Mark as read
                </Button>
              )}

              {chat.type === "group" && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <LeaveGroup
                    chatId={chatId}
                    currentUserId={currentUserId}
                    onLeaveSuccess={clearCurrentChat}
                  />
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            {chat.type === "direct" && (
              <Icon
                icon="pajamas:status-active"
                width="12"
                height="12"
                className={`absolute top-0 right-0 z-50 border-2 rounded-full border-gray-800 ${
                  getOtherUserInDirectChat(chat)?.active
                    ? "text-green-500"
                    : " text-gray-500"
                }`}
              />
            )}

            <Avatar className="w-10 h-10">
              <AvatarImage src={getChatPhoto(chat)} />
              <AvatarFallback>P</AvatarFallback>
            </Avatar>
          </div>

          <div className="w-full">
            <div className="text-sm capitalize flex justify-start items-center gap-1.5 font-semibold">
              {chat.type === "group" && (
                <span>
                  <Icon
                    icon="solar:users-group-two-rounded-bold"
                    width="16"
                    height="16"
                  />
                </span>
              )}
              <h1 className="max-w-40 sm:max-w-32 truncate">
                {getChatDisplayName(chat)}
              </h1>
            </div>
            <div
              className={`text-xs max-w-32 capitalize flex items-center gap-1 ${
                !chat.seenBy?.includes(currentUserId)
                  ? "font-bold text-white"
                  : "text-gray-400"
              }`}
            >
              {/* Show last message preview */}
              {chat.lastMessage && (
                <div className="text-[10px] w-full overflow-hidden truncate">
                  {chat.lastMessage}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Show timestamp */}
        {chat.lastMessageTime && (
          <div
            className={`text-[10px] absolute bottom-0 right-2 ${
              !chat.seenBy?.includes(currentUserId)
                ? " text-gray-200"
                : "text-gray-400"
            }`}
          >
            <div className="flex justify-start items-center">
              {chat.seenBy?.includes(currentUserId) && (
                <span>
                  {" "}
                  <Icon
                    icon="solar:check-read-linear"
                    width="14"
                    height="14"
                    className="text-green-500"
                  />
                </span>
              )}

              {formatTimestamp(chat.lastMessageTime)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="">
        {pinnedChats.map((chat) => (
          <ChatCard key={chat.id} chat={chat} />
        ))}
      </div>
      <div className="">
        {unpinnedChats.map((chat) => (
          <ChatCard key={chat.id} chat={chat} />
        ))}
      </div>
    </>
  );
};
