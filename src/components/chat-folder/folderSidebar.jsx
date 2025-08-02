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
import { db } from "@/firebase";
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
import { useMentions } from "@/stores/useUsersMentions";
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
    clearMessage,
    clearReply,
    clearEdit,
    clearPastedImage,
  } = useMessageActionStore();
  const { user } = useUserStore();
  const { setFolderSidebar } = useChatFolderStore();
  const { clearMentionSuggestions } = useMentions();

  const [topics, setTopics] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [memberCount, setMemberCount] = useState(0);

  const toggleMenu = () => {
    console.log(menu);
    setMenu(true);
  };

  const handleSelectChat = (chat) => {
    clearMentionSuggestions();
    clearReply();
    clearEdit();
    clearPastedImage();
    clearMessage();
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
    setChatIdTo(chat.id);
    setCurrentChat(chat);
    console.log(chat.id, chat.type);
  };

  const viewAsMessages = () => {
    clearTopicId();
    setChatIdTo(chatId);
    setFolderSidebar(false);
  };

  const closeFolderSidebar = () => {
    clearTopicId();
    clearCurrentTopic();
    setFolderSidebar(false);
    clearCurrentChat();
    clearChat();
  };

  const clearTopic = () => {
    clearTopicId();
    clearCurrentTopic();
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
        <div className="border-r w-20 p-2 relative scrollbar-hide h-full overflow-y-auto bg-gray-50 dark:bg-gray-700">
          <div className="absolute top-0 w-full z-10  left-0">
            <div className="flex items-center justify-center border-b  bg-white dark:bg-gray-800 pt-2 pb-1.5">
              <div
                onClick={() => toggleMenu()}
                className="rounded-full flex justify-center items-center dark:bg-gray-700/20 p-2 border"
              >
                <Icon icon="duo-icons:menu" width="24" height="24" />
              </div>
            </div>
          </div>

          <div className="overflow-y-auto scrollbar-hide pt-14 h-full w-full">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className="py-1 flex justify-center items-center cursor-pointer"
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
        <div className=" relative scrollbar-hide w-full">
          <div className="absolute top-0 left-0 w-full">
            <div className="flex justify-between items-center m-0 bg-white dark:bg-gray-800 border-b p-2">
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
                  <p className="font-semibold capitalize text-base max-w-32 truncate">
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
                      clearTopic();
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
                    <Button
                      variant="ghost"
                      className=" flex justify-start w-full"
                      onClick={() => viewAsMessages()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={20}
                        height={20}
                        viewBox="0 0 24 24"
                      >
                        <g fill="none">
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeWidth={1.5}
                            d="M8 9h8m-8 3.5h5.5"
                          ></path>
                          <path
                            fill="currentColor"
                            d="m13.087 21.388l.645.382zm.542-.916l-.646-.382zm-3.258 0l-.645.382zm.542.916l.646-.382zM1.25 10.5a.75.75 0 0 0 1.5 0zm1.824 5.126a.75.75 0 0 0-1.386.574zm4.716 3.365l-.013.75zm-2.703-.372l-.287.693zm16.532-2.706l.693.287zm-5.409 3.078l-.012-.75zm2.703-.372l.287.693zm.7-15.882l-.392.64zm1.65 1.65l.64-.391zM4.388 2.738l-.392-.64zm-1.651 1.65l-.64-.391zM9.403 19.21l.377-.649zm4.33 2.56l.541-.916l-1.29-.764l-.543.916zm-4.007-.916l.542.916l1.29-.764l-.541-.916zm2.715.152a.52.52 0 0 1-.882 0l-1.291.764c.773 1.307 2.69 1.307 3.464 0zM10.5 2.75h3v-1.5h-3zm10.75 7.75v1h1.5v-1zM7.803 18.242c-1.256-.022-1.914-.102-2.43-.316L4.8 19.313c.805.334 1.721.408 2.977.43zM1.688 16.2A5.75 5.75 0 0 0 4.8 19.312l.574-1.386a4.25 4.25 0 0 1-2.3-2.3zm19.562-4.7c0 1.175 0 2.019-.046 2.685c-.045.659-.131 1.089-.277 1.441l1.385.574c.235-.566.338-1.178.389-1.913c.05-.729.049-1.632.049-2.787zm-5.027 8.241c1.256-.021 2.172-.095 2.977-.429l-.574-1.386c-.515.214-1.173.294-2.428.316zm4.704-4.115a4.25 4.25 0 0 1-2.3 2.3l.573 1.386a5.75 5.75 0 0 0 3.112-3.112zM13.5 2.75c1.651 0 2.837 0 3.762.089c.914.087 1.495.253 1.959.537l.783-1.279c-.739-.452-1.577-.654-2.6-.752c-1.012-.096-2.282-.095-3.904-.095zm9.25 7.75c0-1.622 0-2.891-.096-3.904c-.097-1.023-.299-1.862-.751-2.6l-1.28.783c.285.464.451 1.045.538 1.96c.088.924.089 2.11.089 3.761zm-3.53-7.124a4.25 4.25 0 0 1 1.404 1.403l1.279-.783a5.75 5.75 0 0 0-1.899-1.899zM10.5 1.25c-1.622 0-2.891 0-3.904.095c-1.023.098-1.862.3-2.6.752l.783 1.28c.464-.285 1.045-.451 1.96-.538c.924-.088 2.11-.089 3.761-.089zM2.75 10.5c0-1.651 0-2.837.089-3.762c.087-.914.253-1.495.537-1.959l-1.279-.783c-.452.738-.654 1.577-.752 2.6C1.25 7.61 1.25 8.878 1.25 10.5zm1.246-8.403a5.75 5.75 0 0 0-1.899 1.899l1.28.783a4.25 4.25 0 0 1 1.402-1.403zm7.02 17.993c-.202-.343-.38-.646-.554-.884a2.2 2.2 0 0 0-.682-.645l-.754 1.297c.047.028.112.078.224.232c.121.166.258.396.476.764zm-3.24-.349c.44.008.718.014.93.037c.198.022.275.054.32.08l.754-1.297a2.2 2.2 0 0 0-.909-.274c-.298-.033-.657-.038-1.069-.045zm6.498 1.113c.218-.367.355-.598.476-.764c.112-.154.177-.204.224-.232l-.754-1.297c-.29.17-.5.395-.682.645c-.173.238-.352.54-.555.884zm1.924-2.612c-.412.007-.771.012-1.069.045c-.311.035-.616.104-.909.274l.754 1.297c.045-.026.122-.058.32-.08c.212-.023.49-.03.93-.037z"
                          ></path>
                        </g>
                      </svg>
                      View as messages
                    </Button>

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
          </div>
          <div className=" overflow-y-auto scrollbar-hide pt-14 h-full w-full">
            {topics.map((topic) => (
              <FolderList key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
