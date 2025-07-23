import React from "react";
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
//import { TypingIndicator } from "./TypingIndicator";
//import { useTypingStatus } from "@/stores/useTypingStatus";

const ChatList = ({
  filteredChats,
  handleSelectChat,
  getOtherUserInDirectChat,
  getChatPhoto,
  getChatDisplayName,
  //getSenderDisplayName,
  currentUserId,
  clearCurrentChat,
}) => {
  const { chatId } = useMessageActionStore();
  //const { userNames } = useTypingStatus();
  //const chatTypingUsers = userNames;
  //console.log(chatTypingUsers);

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
        className={`group cursor-pointer p-2 relative  transition-colors
  ${
    chatId === chat.id
      ? "bg-blue-500/30 hover:bg-blue-500/40"
      : "hover:dark:bg-gray-700 hover:bg-gray-200"
  }
  ${
    chat.pin?.includes(currentUserId)
      ? "border bg-blue-500/5 my-0.5 dark:border-gray-700 border-gray-300"
      : ""
  }
`}
      >
        <div className="absolute top-0 right-0 z-10 sm:not-visited:opacity-0 sm:group-hover:opacity-100  transition-opacity duration-150 backdrop-blur-sm">
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

        <div className="flex items-center  gap-2">
          <div className="relative">
            {chat.type === "direct" && (
              <div
                className={`absolute top-0 right-0 z-50 border-2 rounded-full dark:border-gray-800 ${
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

            <Avatar className="w-10 h-10 border">
              <AvatarImage src={getChatPhoto(chat)} />
              <AvatarFallback>
                {" "}
                {getChatDisplayName(chat)[0]?.toUpperCase() || "U"}
              </AvatarFallback>
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
              className={`text-xs w-full relative capitalize flex items-center gap-1 ${
                !chat.seenBy?.includes(currentUserId)
                  ? "font-bold text-blue-500 dark:text-white"
                  : "dark:text-gray-400 "
              }`}
            >
              <div className="flex justify-between w-full items-center">
                {chat.lastMessage && (
                  <div className="text-[10px] max-w-32 truncate">
                    {chat.lastMessage}
                  </div>
                )}
                {/* Show timestamp */}
                {chat.lastMessageTime && (
                  <div className="flex justify-start text-[10px] gap-0.5 items-center">
                    {chat.seenBy?.includes(currentUserId) && (
                      <p>
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
                      </p>
                    )}

                    <p className="flex">
                      {formatTimestamp(chat.lastMessageTime)}
                    </p>
                    {chat.pin?.includes(currentUserId) && (
                      <div className=" text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="m19.184 7.805l-2.965-2.967c-2.027-2.03-3.04-3.043-4.129-2.803s-1.581 1.587-2.568 4.28l-.668 1.823c-.263.718-.395 1.077-.632 1.355a2 2 0 0 1-.36.332c-.296.213-.664.314-1.4.517c-1.66.458-2.491.687-2.804 1.23a1.53 1.53 0 0 0-.204.773c.004.627.613 1.236 1.83 2.455L6.7 16.216l-4.476 4.48a.764.764 0 0 0 1.08 1.08l4.475-4.48l1.466 1.468c1.226 1.226 1.839 1.84 2.47 1.84c.265 0 .526-.068.757-.2c.548-.313.778-1.149 1.239-2.822c.202-.735.303-1.102.515-1.399q.14-.194.322-.352c.275-.238.632-.372 1.345-.64l1.844-.693c2.664-1 3.996-1.501 4.23-2.586c.235-1.086-.77-2.093-2.783-4.107"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* <div className="min-w-32  text-[10px]">
              <TypingIndicator
                chatId={chat.id}
                getName={getSenderDisplayName}
              />
            </div> */}
            {!chat.pin?.includes(currentUserId) && chat.lastMessage && (
              <hr className="mt-2" />
            )}
          </div>
        </div>
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
