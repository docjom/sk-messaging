import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase"; // adjust path
import { useMenu } from "@/hooks/useMenuState";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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
    // topicId,
    setSelectedUser,
    clearCurrentChat,
    clearChat,
  } = useMessageActionStore();
  const { user } = useUserStore();
  const { setFolderSidebar } = useChatFolderStore();

  const [topics, setTopics] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [memberCount, setMemberCount] = useState(0);

  const toggleMenu = () => {
    console.log(menu);
    setMenu(true);
  };

  const handleSelectChat = (chat) => {
    if (!chat.hasChatTopic) {
      const otherUserId = chat.users.find((uid) => uid !== user?.uid);
      const otherUser = users.find((u) => u.id === otherUserId);
      setSelectedUser(otherUser);
      clearTopicId();
      clearCurrentTopic();
      setChatIdTo(chat.id);
      setCurrentChat(chat);
      setFolderSidebar(false);
    }
    console.log(chat.id, chat.type);
  };

  const closeFolderSidebar = () => {
    clearTopicId();
    clearCurrentTopic();
    setFolderSidebar(false);
    clearCurrentChat();
    clearChat();
  };

  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    if (!chatId) return;

    const fetchGroupData = async () => {
      try {
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);

        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          setGroupName(chatData.name || "Unnamed Group");
          setMemberCount(chatData.users?.length || 0);

          // ✅ Get current user's role from userRoles
          const role = chatData.userRoles?.[user.uid];
          setUserRole(role || "member");

          if (chatData.hasChatTopic) {
            const topicsRef = collection(db, "chats", chatId, "topics");
            const topicsQuery = query(
              topicsRef,
              orderBy("lastMessageTime", "desc")
            );

            const unsubscribe = onSnapshot(topicsQuery, (snapshot) => {
              const loadedTopics = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setTopics(loadedTopics);
            });

            return unsubscribe;
          } else {
            setTopics([]);
          }
        }
      } catch (err) {
        console.error("Error loading chat/group topics:", err);
      }
    };

    const unsubscribePromise = fetchGroupData();

    return () => {
      if (typeof unsubscribePromise === "function") {
        unsubscribePromise();
      } else if (unsubscribePromise instanceof Promise) {
        unsubscribePromise.then((unsub) => unsub && unsub());
      }
    };
  }, [chatId, user.uid]);

  return (
    <>
      <div className="sm:w-64 w-full  dark:bg-gray-800 border-r fixed lg:sticky top-0 left-0 z-30 overflow-y-auto bg-white flex h-full ">
        <div className="border-r bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-start gap-2 m-2">
            <div
              onClick={() => toggleMenu()}
              className="rounded-full dark:bg-gray-700/20 p-2"
            >
              <Icon icon="duo-icons:menu" width="24" height="24" />
            </div>
          </div>
          <div>
            <div className="">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className="m-2"
                >
                  <Avatar
                    className={`w-10 h-10 border  ${
                      chatId === chat.id
                        ? "border-2 border-blue-500 shadow-lg"
                        : ""
                    }`}
                  >
                    <AvatarImage src={getChatPhoto(chat)} />
                    <AvatarFallback>
                      {" "}
                      {getChatDisplayName(chat)[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full h-full">
          <div className="flex justify-between items-center border-b p-2">
            <div className="flex justify-start items-center gap-2">
              <div
                onClick={() => closeFolderSidebar()}
                className="text-gray-700 dark:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 512 512"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="48"
                    d="M244 400L100 256l144-144M120 256h292"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-base max-w-32 truncate">
                  {groupName}
                </p>
                <p className="text-xs">{memberCount} members</p>
              </div>
            </div>
            <div>
              <Popover>
                <PopoverTrigger
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={20}
                    height={20}
                    viewBox="0 0 21 21"
                  >
                    <g fill="currentColor" fillRule="evenodd">
                      <circle cx={10.5} cy={10.5} r={1}></circle>
                      <circle cx={10.5} cy={5.5} r={1}></circle>
                      <circle cx={10.5} cy={15.5} r={1}></circle>
                    </g>
                  </svg>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-0">
                  <EditGroup chatId={chatId} currentUserId={user?.uid} />
                  {userRole === "admin" && <CreateNewTopic />}
                  <PinnedMessages chatId={chatId} />
                  <ChatFiles chatId={chatId} />
                  <LeaveGroup
                    chatId={chatId}
                    currentUserId={user?.uid}
                    onLeaveSuccess={clearCurrentChat}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="">
            {topics.map((topic) => (
              <FolderList key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
