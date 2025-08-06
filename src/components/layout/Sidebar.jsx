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
import { Badge, Folder, MessageSquare } from "lucide-react";
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
  return (
    <div className="flex">
      {!folderSidebar && (
        <>
          {" "}
          <div className="">
            <div className={className}>
              <div className="relative">
                <div className="absolute top-0 left-0 z-50 bg-white dark:bg-gray-800 w-full border-b ">
                  <div className="flex items-center justify-start gap-2 px-2 pt-1.5 pb-1.5">
                    <div
                      onClick={() => toggleMenu()}
                      className="rounded-full dark:bg-gray-700/20 p-2"
                    >
                      <Icon icon="duo-icons:menu" width="24" height="24" />
                    </div>
                    <div className="w-full">
                      <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full rounded-full border border-gray-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="h-screen ">
                  <div className="flex ">
                    {hasFolders && (
                      <>
                        <div className="  w-15 pt-13 h-screen overflow-y-auto bg-gray-900 text-white">
                          <div className="flex justify-center items-center">
                            <div>
                              <div className="p-1">
                                <div className="flex  items-center justify-center text-blue-400 ">
                                  <MessageSquare size={20} />
                                </div>
                                <div className="text-xs text-center text-blue-400">
                                  All chats
                                </div>
                              </div>
                              {folders.map((folder) => (
                                <div key={folder.id} className="p-1">
                                  <div className="flex  items-center justify-center ">
                                    <Folder className="h-5 w-5 " />
                                  </div>
                                  <div className="text-xs text-center">
                                    {folder.folderName}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="h-screen w-full pt-13 overflow-y-auto">
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

  const getUserData = useCallback(
    (userId) => users.find((u) => u.id === userId) || null,
    [users]
  );

  const getOtherUserInDirectChat = useCallback(
    (chat) => {
      if (chat.type !== "direct") return null;
      const otherUserId = chat.users.find((uid) => uid !== user?.uid);
      return getUserData(otherUserId);
    },
    [user?.uid, getUserData]
  );

  const getChatDisplayName = useCallback(
    (chat) => {
      if (chat.type === "direct") {
        if (chat.users.length === 1 && chat.users[0] === user?.uid) {
          return "Saved Messages";
        }

        const otherUserId = chat.users.find((uid) => uid !== user?.uid);
        const otherUser = users.find((u) => u.id === otherUserId);
        return otherUser?.displayName || "Unknown User";
      }

      if (chat.type === "saved") {
        return "Saved Messages";
      }

      return chat.name;
    },
    [user?.uid, users]
  );

  const getChatPhoto = useCallback(
    (chat) => {
      if (chat.type === "direct") {
        const otherUserId = chat.users.find((uid) => uid !== user?.uid);
        const otherUser = users.find((u) => u.id === otherUserId);
        return otherUser?.photoURL;
      }
      return chat.photoURL;
    },
    [user?.uid, users]
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
          className="w-screen bg-white dark:bg-gray-800 border-r sm:hidden fixed lg:sticky top-0 left-0 z-30  flex-col h-full"
        />
      )}
      {folderSidebar && (
        <FolderSidebar
          filteredChats={filteredChats}
          getChatPhoto={getChatPhoto}
          getChatDisplayName={getChatDisplayName}
        />
      )}

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
        className={` hidden bg-white dark:bg-gray-800 border-r sm:fixed lg:sticky top-0 left-0 z-10   sm:flex flex-col h-full ${
          hasFolders ? "w-74" : "w-64"
        } `}
      />
    </>
  );
};

export default React.memo(Sidebar);
