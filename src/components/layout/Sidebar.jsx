import { Icon } from "@iconify/react";
import React, { useState, useEffect, useCallback } from "react";
import ChatList from "@/components/chat/ChatList";
import { Input } from "@/components/ui/input";
import { ChatListLoading } from "../chat/ChatListLoading";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { db } from "@/firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { useUserStore } from "@/stores/useUserStore";

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
  clearChat,
  getSenderDisplayName,
  toggleMenu,
  className = "",
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-start gap-2 mb-4">
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
        <div className="mx-1 p-2 border-gray-600/50 rounded-lg border text-gray-500">
          No Recent Chats
        </div>
      )}
    </div>
  );
}

const Sidebar = ({ toggleMenu, handleSelectChat, getSenderDisplayName }) => {
  const { chats, setChats, clearChat, chatId, users } = useMessageActionStore();
  const [searchTerm, setSearchTerm] = useState("");
  const user = useUserStore((s) => s.user);
  const [chatsLoading, setChatsLoading] = useState(true);

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
        const otherUserId = chat.users.find((uid) => uid !== user?.uid);
        const otherUser = users.find((u) => u.id === otherUserId);
        return otherUser?.displayName || "Unknown User";
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
    if (user) {
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("users", "array-contains", user?.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chatsArray = [];
        querySnapshot.forEach((doc) => {
          chatsArray.push({ id: doc.id, ...doc.data() });
        });
        setChats(chatsArray);
        setChatsLoading(false);
      });
      return () => unsubscribe();
    }
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
          handleSelectChat={handleSelectChat}
          getOtherUserInDirectChat={getOtherUserInDirectChat}
          getChatPhoto={getChatPhoto}
          getChatDisplayName={getChatDisplayName}
          user={user}
          clearChat={clearChat}
          getSenderDisplayName={getSenderDisplayName}
          toggleMenu={toggleMenu}
          className="w-screen bg-white dark:bg-gray-800 border-r sm:hidden fixed lg:sticky top-0 left-0 z-30 overflow-y-auto p-2 flex flex-col h-full"
        />
      )}

      <SidebarPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        chatsLoading={chatsLoading}
        filteredChats={filteredChats}
        handleSelectChat={handleSelectChat}
        getOtherUserInDirectChat={getOtherUserInDirectChat}
        getChatPhoto={getChatPhoto}
        getChatDisplayName={getChatDisplayName}
        user={user}
        clearChat={clearChat}
        getSenderDisplayName={getSenderDisplayName}
        toggleMenu={toggleMenu}
        className="w-64 hidden bg-white dark:bg-gray-800 border-r sm:fixed lg:sticky top-0 left-0 z-10 overflow-y-auto p-2 sm:flex flex-col h-full"
      />
    </>
  );
};

export default React.memo(Sidebar);
