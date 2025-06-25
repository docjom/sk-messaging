import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";

export const ChatList = ({
  filteredChats,
  chatId,
  handleSelectChat,
  getOtherUserInDirectChat,
  getChatPhoto,
  getChatDisplayName,
  formatTimestamp,
}) => {
  return (
    <div className="space-y-2 mb-4 flex-1">
      {filteredChats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => handleSelectChat(chat)}
          className={`cursor-pointer p-2 rounded transition-colors ${
            chatId === chat.id
              ? "bg-blue-500/30 hover:bg-blue-500/40"
              : " hover:bg-gray-700"
          }`}
        >
          <div className="flex items-end gap-2">
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
              <div
                className={`text-sm capitalize truncate max-w-40 ${
                  chatId === chat.id ? "font-semibold " : ""
                }`}
              >
                {getChatDisplayName(chat)}
              </div>
              <div className="text-xs w-52 sm:w-28 capitalize text-gray-400 flex items-center gap-1">
                {chat.type}
                {/* Show last message preview */}
                {chat.lastMessage && (
                  <div
                    className={`text-xs w-full overflow-hidden truncate ${
                      formatTimestamp(chat.lastMessageTime) === "Just now"
                        ? "font-bold text-white"
                        : "text-gray-300"
                    }`}
                  >
                    {chat.lastMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Show timestamp */}
            {chat.lastMessageTime && (
              <div
                className={`text-xs min-w-18 sm:min-w-15 flex justify-end ${
                  formatTimestamp(chat.lastMessageTime) === "Just now"
                    ? "font-bold text-gray-200"
                    : "text-gray-400"
                }`}
              >
                {formatTimestamp(chat.lastMessageTime)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
