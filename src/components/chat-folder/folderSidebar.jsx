import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useMenu } from "@/hooks/useMenuState";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FolderList } from "./folderList";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { useChatFolderStore } from "@/stores/chat-folder/useChatFolderStore";
import { useUserStore } from "@/stores/useUserStore";
import { LeaveGroup } from "../group/LeaveGroup";
import { EditGroup } from "../group/EditGroup";
import { PinnedMessages } from "../chat/PinnedMessages";
import { ChatFiles } from "../chat/ChatFiles";
import { CreateNewTopic } from "./folderCreateNewTopic";
import { useMentions } from "@/stores/useUsersMentions";
import { ChevronLeft, EllipsisVertical, Menu, Search } from "lucide-react";
import { useFolderStore } from "@/stores/chat-folder/useFolderStore";
import { useFolderChatFilter } from "@/hooks/chat-folder/useFolderChatFilter";

export const FolderSidebar = ({
  filteredChats,
  getChatPhoto,
  getChatDisplayName,
}) => {
  const { menu, setMenu } = useMenu();
  const {
    chatId,
    clearTopicId,
    clearCurrentTopic,
    setCurrentChat,
    setChatIdTo,
    users,
    setSelectedUser,
    clearCurrentChat,
    clearChat,
    clearMessage,
    clearReply,
    clearEdit,
    clearPastedImage,
    currentChat,
  } = useMessageActionStore();
  const { user } = useUserStore();
  const { setFolderSidebar } = useChatFolderStore();
  const { clearMentionSuggestions } = useMentions();

  const [topics, setTopics] = useState([]);
  const [userRole, setUserRole] = useState("");
  const { hasFolders, folders } = useFolderStore();

  const { selectedFolder, handleClickFolder, clearFolderFilter } =
    useFolderChatFilter();

  const toggleMenu = () => {
    console.log(menu);
    setMenu(true);
  };

  const clearTopic = () => {
    clearTopicId();
    clearCurrentTopic();
  };

  const searchToggle = () => {
    setFolderSidebar(false);
    clearTopic();
    clearTopicId();
    clearCurrentTopic();
  };

  const handleSelectChat = (chat) => {
    setChatIdTo(chat.id);
    setCurrentChat(chat);
    clearMentionSuggestions();
    clearReply();
    clearEdit();
    clearPastedImage();
    clearMessage();

    if (!chat.hasChatTopic) {
      setFolderSidebar(false);
      clearTopic();
      setChatIdTo(chat.id);
      setCurrentChat(chat);
      const otherUserId = chat.users.find((uid) => uid !== user?.uid);
      const otherUser = users.find((u) => u.id === otherUserId);
      setSelectedUser(otherUser);
    }
  };

  const viewAsMessages = () => {
    clearTopicId();
    setChatIdTo(chatId);
    setFolderSidebar(false);
  };

  const closeFolderSidebar = () => {
    clearTopic();
    setFolderSidebar(false);
    clearCurrentChat();
    clearChat();
  };

  useEffect(() => {
    if (!chatId || !currentChat) return;

    const role = currentChat.userRoles?.[user.uid] || "member";
    setUserRole(role);

    let unsubscribe;

    if (currentChat.hasChatTopic) {
      const topicsRef = collection(db, "chats", chatId, "topics");
      const topicsQuery = query(topicsRef, orderBy("lastMessageTime", "desc"));

      unsubscribe = onSnapshot(topicsQuery, (snapshot) => {
        const loadedTopics = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const sortedTopics = loadedTopics.sort((a, b) => {
          const isAPinned = a.pin?.includes(user.uid) ? 1 : 0;
          const isBPinned = b.pin?.includes(user.uid) ? 1 : 0;

          if (isAPinned !== isBPinned) return isBPinned - isAPinned;

          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;

          return timeB - timeA;
        });

        setTopics(sortedTopics);
      });
    } else {
      setTopics([]);
    }

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [chatId, user.uid, currentChat]);

  return (
    <div className="relative w-full">
      <div className=" fixed sm:static top-0 left-0 z-[48] flex overflow-y-auto bg-white  sm:w-auto w-full sm:h-full dark:bg-gray-800">
        {hasFolders && (
          <>
            <div className="bg-gray-100 dark:bg-gray-900 border-r h-screen">
              <div className="px-3 py-2 flex  justify-center items-center border-b border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMenu}
                  className="w-10 h-10 rounded-full p-0 border-gray-300 dark:border-gray-600"
                >
                  <Menu size={18} />
                </Button>
              </div>
              <div>
                <div className="w-16 overflow-y-auto h-screen">
                  <div className="flex justify-center w-full items-center">
                    <div className="w-full">
                      <div
                        onClick={() => clearFolderFilter()}
                        className={`py-2.5 hover:bg-gray-300 hover:dark:bg-gray-900 color-transition duration-200 cursor-pointer ${
                          !selectedFolder
                            ? "text-blue-500 bg-gray-300 dark:bg-gray-950"
                            : "text-gray-500"
                        }`}
                      >
                        <div className="flex  items-center justify-center  ">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={20}
                            height={20}
                            viewBox="-2 -2.5 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M3.656 17.979A1 1 0 0 1 2 17.243V15a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8.003zM16 10.017a7 7 0 0 0 0 .369zq.007-.16.004-4.019a3 3 0 0 0-3-2.997H5V2a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2v2.243a1 1 0 0 1-1.656.736L16 13.743z"
                            ></path>
                          </svg>
                        </div>
                        <div className="text-[10px] text-center ">
                          All chats
                        </div>
                      </div>
                      {folders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => handleClickFolder(folder)}
                          className={`py-2 hover:bg-gray-300 hover:dark:bg-gray-900 color-transition duration-200 cursor-pointer ${
                            folder.id !== selectedFolder?.id
                              ? "text-gray-500"
                              : "text-blue-500 shadow bg-gray-300 dark:bg-gray-950"
                          }`}
                        >
                          <div className="flex  items-center justify-center ">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={20}
                              height={20}
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 6a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 13.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                              ></path>
                            </svg>
                          </div>
                          <div className="text-[10px] text-center">
                            {folder.folderName.length > 10
                              ? `${folder.folderName.substring(0, 10)}...`
                              : folder.folderName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Chat List Sidebar - Left Panel */}
        <div className="w-16 flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Menu Button */}
          <div className="px-3 py-2 flex  justify-center items-center border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={searchToggle}
              className="w-10 h-10 rounded-full p-0 border-gray-300 dark:border-gray-600"
            >
              <Search size={18} />
            </Button>
          </div>

          {/* Chat Avatars List */}
          <div className="relative">
            <div className="flex-1 overflow-y-auto scrollbar-hide h-screen py-2">
              <div className="flex flex-col items-center gap-2">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`cursor-pointer transition-all py-0.5 duration-200 ${
                      chatId === chat.id ? "scale-110" : "hover:scale-105"
                    }`}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar
                          className={`w-12 h-12 border-2 transition-all duration-200 ${
                            chatId === chat.id
                              ? "border-blue-500 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800"
                              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                          }`}
                        >
                          <AvatarImage src={getChatPhoto(chat)} />
                          <AvatarFallback className="text-sm font-medium">
                            {getChatDisplayName(chat)[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p> {getChatDisplayName(chat)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Topics Panel - Right Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800">
          {/* Header */}
          <div className="flex  items-center justify-between p-2  border-b border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeFolderSidebar}
                className="p-2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft size={20} />
              </Button>

              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-base capitalize truncate text-gray-900 dark:text-white">
                  {currentChat?.name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentChat?.users?.length} members
                </p>
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearTopic();
                  }}
                >
                  <EllipsisVertical size={18} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" align="end">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-semibold"
                  onClick={viewAsMessages}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 9h8" />
                    <path d="M8 13h6" />
                    <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12z" />
                  </svg>
                  View as Messages
                </Button>

                <EditGroup chatId={chatId} currentUserId={user?.uid} />

                {userRole === "admin" && <CreateNewTopic />}

                <PinnedMessages chatId={chatId} />
                <ChatFiles chatId={chatId} />

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

                <LeaveGroup
                  chatId={chatId}
                  currentUserId={user?.uid}
                  onLeaveSuccess={clearCurrentChat}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="relative">
            {/* Topics List */}
            <div className="flex-1  border-r overflow-y-auto scrollbar-hide h-screen bg-white dark:bg-gray-800">
              {topics.length > 0 ? (
                <div className="divide-y divide-gray-100 pb-14 dark:divide-gray-700">
                  {topics.map((topic) => (
                    <FolderList key={topic.id} topic={topic} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={48}
                      height={48}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto mb-3 text-gray-400 dark:text-gray-600"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <path d="M8 9h8" />
                      <path d="M8 13h6" />
                    </svg>
                    <p className="text-sm">No topics yet</p>
                    <p className="text-xs mt-1">
                      Create a topic to organize your conversations
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
