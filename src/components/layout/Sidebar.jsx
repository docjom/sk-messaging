import { Icon } from "@iconify/react";
import React, { useState, useEffect, useCallback } from "react";
import ChatList from "@/components/chat/ChatList";
import { Input } from "@/components/ui/input";
import { ChatListLoading } from "../chat/ChatListLoading";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { db } from "@/firebase";
import {
  collection,
  query,
  onSnapshot,
  where,
  orderBy,
} from "firebase/firestore";
import { useUserStore } from "@/stores/useUserStore";
import { FolderSidebar } from "../chat-folder/folderSidebar";
import { useChatFolderStore } from "@/stores/chat-folder/useChatFolderStore";
import { useFolderStore } from "@/stores/chat-folder/useFolderStore";
import { Badge, Folder, Menu, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import { useFolderChatFilter } from "@/hooks/chat-folder/useFolderChatFilter";
function SidebarPanel({
  searchTerm,
  setSearchTerm,
  chatsLoading,
  filteredChats,
  handleSelectChat,
  getOtherUserInDirectChat,
  getChatPhoto,
  getChatDisplayName,
  user,
  folderSidebar,
  clearChat,
  getSenderDisplayName,
  toggleMenu,
  className = "",
  hasFolders,
  folders,
}) {
  const { selectedFolder, handleClickFolder, clearFolderFilter } =
    useFolderChatFilter();
  return (
    <div className="flex">
      {!folderSidebar && (
        <>
          <div className={className}>
            <div className="h-screen ">
              <div className="flex ">
                {hasFolders && (
                  <div className="block w-16 border-r border-gray-200 dark:border-gray-900 flex-shrink-0">
                    <div className="flex py-2 bg-gray-100 dark:bg-gray-900  justify-center  items-center ">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleMenu}
                        className="w-10 h-10 rounded-full p-0 border-gray-300 dark:border-gray-600"
                      >
                        <Menu size={18} />
                      </Button>
                    </div>
                    <div className="  h-screen overflow-y-auto bg-gray-100 dark:bg-gray-900 ">
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
                )}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className=" flex justify-center items-center">
                    {!hasFolders && (
                      <div className="flex py-2 px-2   justify-center  items-center ">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleMenu}
                          className="w-10 h-10 rounded-full p-0 border-gray-300 dark:border-gray-600"
                        >
                          <Menu size={18} />
                        </Button>
                      </div>
                    )}
                    <Input
                      type="search"
                      placeholder="Search..."
                      className={`rounded-full  dark:bg-gray-600/50 bg-gray-100 ${
                        !hasFolders ? "mr-2" : "my-2.5 mx-2"
                      } `}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="h-screen w-full relative overflow-y-auto">
                    {chatsLoading ? (
                      <ChatListLoading />
                    ) : filteredChats.length > 0 ? (
                      <ChatList
                        filteredChats={filteredChats}
                        handleSelectChat={handleSelectChat}
                        getOtherUserInDirectChat={getOtherUserInDirectChat}
                        getChatPhoto={getChatPhoto}
                        getChatDisplayName={getChatDisplayName}
                        currentUserId={user?.uid}
                        onLeaveSuccess={clearChat}
                        getSenderDisplayName={getSenderDisplayName}
                      />
                    ) : (
                      <div className="mx-1 p-2  rounded-lg text-sm text-gray-500">
                        No Recent Chats
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const Sidebar = ({ toggleMenu, handleSelectChat, getSenderDisplayName }) => {
  const { chats, setChats, clearChat, chatId, users } = useMessageActionStore();
  const [searchTerm, setSearchTerm] = useState("");
  const user = useUserStore((s) => s?.user);
  const [chatsLoading, setChatsLoading] = useState(true);
  const { folderSidebar } = useChatFolderStore();
  const { hasFolders, folders, setFolders } = useFolderStore();

  useEffect(() => {
    if (!user?.uid) return;

    // Load folders
    const foldersQuery = query(
      collection(db, "folders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      const folderData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFolders(folderData);
    });

    return () => {
      unsubscribeFolders();
    };
  }, [user, setFolders]);

  const usersMap = React.useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const getOtherUserInDirectChat = useCallback(
    (chat) => {
      if (chat.type !== "direct") return null;
      const otherUserId = chat.users.find((uid) => uid !== user?.uid);
      return usersMap.get(otherUserId) || null;
    },
    [user?.uid, usersMap]
  );
  const getChatDisplayName = useCallback(
    (chat) => {
      if (chat.type === "direct") {
        if (chat.users.length === 1 && chat.users[0] === user?.uid) {
          return "Saved Messages";
        }

        const otherUserId = chat.users.find((uid) => uid !== user?.uid);
        const otherUser = usersMap.get(otherUserId);
        return otherUser?.displayName || "Unknown User";
      }

      if (chat.type === "saved") {
        return "Saved Messages";
      }

      return chat.name;
    },
    [user?.uid, usersMap]
  );

  const getChatPhoto = useCallback(
    (chat) => {
      if (chat.type === "direct") {
        const otherUserId = chat.users.find((uid) => uid !== user?.uid);
        const otherUser = usersMap.get(otherUserId);
        return otherUser?.photoURL;
      }
      return chat.photoURL;
    },
    [user?.uid, usersMap]
  );

  useEffect(() => {
    if (!user) {
      setChats([]);
      setChatsLoading(false);
      return;
    }
    setChatsLoading(true);
    const cacheKey = `user_${user.uid}_chats`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        const maxCacheAge = 5 * 60 * 1000;
        if (cacheAge < maxCacheAge) {
          setChats(data);
          setChatsLoading(false);
        }
      } catch (err) {
        console.warn("Chats cache parse failed:", err);
        localStorage.removeItem(cacheKey);
      }
    }
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("users", "array-contains", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatsArray = [];
      querySnapshot.forEach((doc) => {
        chatsArray.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
        });
      });
      setChats(chatsArray);
      setChatsLoading(false);
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: chatsArray,
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        console.warn("Failed to cache chats:", err);
      }
    });

    return () => unsubscribe();
  }, [user, setChats]);

  const sortedChats = React.useMemo(() => {
    return chats.slice().sort((a, b) => {
      const aTime =
        a.lastMessageTime?.toMillis?.() || (a.id === chatId ? Date.now() : 0);
      const bTime =
        b.lastMessageTime?.toMillis?.() || (b.id === chatId ? Date.now() : 0);
      return bTime - aTime;
    });
  }, [chats, chatId]);

  const filteredChats = React.useMemo(() => {
    return sortedChats.filter((chat) => {
      const name = getChatDisplayName(chat).toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  }, [sortedChats, searchTerm, getChatDisplayName]);

  return (
    <>
      {!chatId && (
        <SidebarPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          chatsLoading={chatsLoading}
          filteredChats={filteredChats}
          folders={folders}
          hasFolders={hasFolders}
          handleSelectChat={handleSelectChat}
          getOtherUserInDirectChat={getOtherUserInDirectChat}
          getChatPhoto={getChatPhoto}
          getChatDisplayName={getChatDisplayName}
          user={user}
          clearChat={clearChat}
          getSenderDisplayName={getSenderDisplayName}
          toggleMenu={toggleMenu}
          className="w-full bg-white dark:bg-gray-800 border-r sm:hidden fixed lg:sticky top-0 left-0 z-30  flex-col h-full"
        />
      )}
      {folderSidebar && (
        <FolderSidebar
          filteredChats={filteredChats}
          getChatPhoto={getChatPhoto}
          getChatDisplayName={getChatDisplayName}
        />
      )}

      <div className="w-full relative">
        <SidebarPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          chatsLoading={chatsLoading}
          filteredChats={filteredChats}
          folders={folders}
          hasFolders={hasFolders}
          handleSelectChat={handleSelectChat}
          getOtherUserInDirectChat={getOtherUserInDirectChat}
          getChatPhoto={getChatPhoto}
          getChatDisplayName={getChatDisplayName}
          user={user}
          clearChat={clearChat}
          folderSidebar={folderSidebar}
          getSenderDisplayName={getSenderDisplayName}
          toggleMenu={toggleMenu}
          className="bg-white hidden sm:block dark:bg-gray-800 border-r w-full relative"
        />
      </div>
    </>
  );
};

export default React.memo(Sidebar);
