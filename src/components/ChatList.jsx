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
import { useMessageActionStore } from "../stores/useMessageActionStore";
import { formatTimestamp } from "../composables/scripts";

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
              <div
                className={`absolute top-0 right-0 z-50 border-2 rounded-full border-gray-800 ${
                  getOtherUserInDirectChat(chat)?.active
                    ? "text-green-500"
                    : " text-gray-500"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="8"
                  height="8"
                  viewBox="0 0 12 12"
                >
                  <circle cx="6" cy="6" r="6" fill="currentColor" />
                </svg>
              </div>
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M15.5 7.5a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0m2.5 9c0 1.933-2.686 3.5-6 3.5s-6-1.567-6-3.5S8.686 13 12 13s6 1.567 6 3.5M7.122 5q.267 0 .518.05A5 5 0 0 0 7 7.5c0 .868.221 1.685.61 2.396q-.237.045-.488.045c-1.414 0-2.561-1.106-2.561-2.47S5.708 5 7.122 5M5.447 18.986C4.88 18.307 4.5 17.474 4.5 16.5c0-.944.357-1.756.896-2.423C3.49 14.225 2 15.267 2 16.529c0 1.275 1.517 2.325 3.447 2.457M17 7.5c0 .868-.221 1.685-.61 2.396q.236.045.488.045c1.414 0 2.56-1.106 2.56-2.47S18.293 5 16.879 5q-.267 0-.518.05c.407.724.64 1.56.64 2.45m1.552 11.486c1.93-.132 3.447-1.182 3.447-2.457c0-1.263-1.491-2.304-3.396-2.452c.54.667.896 1.479.896 2.423c0 .974-.38 1.807-.947 2.486"
                    />
                  </svg>
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    className="text-green-500"
                  >
                    <g fill="none">
                      <path
                        fill="currentColor"
                        d="M4.565 12.407a.75.75 0 1 0-1.13.986zM7.143 16.5l-.565.493a.75.75 0 0 0 1.13 0zm8.422-8.507a.75.75 0 1 0-1.13-.986zm-5.059 3.514a.75.75 0 0 0 1.13.986zm-.834 3.236a.75.75 0 1 0-1.13-.986zm-6.237-1.35l3.143 3.6l1.13-.986l-3.143-3.6zm4.273 3.6l1.964-2.25l-1.13-.986l-1.964 2.25zm3.928-4.5l1.965-2.25l-1.13-.986l-1.965 2.25zm1.965-2.25l1.964-2.25l-1.13-.986l-1.964 2.25z"
                      />
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="m20 7.563l-4.286 4.5M11 16l.429.563l2.143-2.25"
                      />
                    </g>
                  </svg>
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

export default React.memo(ChatList);
