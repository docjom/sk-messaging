import { useEffect, useState } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatArea } from "./ChatArea";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";

export function ChatLayout() {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setAllChats] = useState([]);
  const [messages, setMessages] = useState([]);

  // ✅ Get all group chats
  useEffect(() => {
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("type", "==", "group"),
      orderBy("createdAt", "desc")
    );

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
      setAllChats(chatsArray);

      // auto-select the first chat if none selected
      if (!selectedChatId && chatsArray.length > 0) {
        setSelectedChatId(chatsArray[0].id);
      }
    });

    return () => unsubscribe();
  }, [selectedChatId]);

  console.log("Chats:", chats);

  // ✅ Get messages of selected chat
  useEffect(() => {
    if (!selectedChatId) return;

    const messagesRef = collection(db, "chats", selectedChatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgsArray = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        msgsArray.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate
            ? data.timestamp.toDate()
            : data.timestamp,
        });
      });

      setMessages(msgsArray);
    });

    return () => unsubscribe();
  }, [selectedChatId]);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  console.log("Selected Chat:", selectedChat);
  console.log("Messages:", messages);

  return (
    <>
      <h1 className="sr-only">All Group Chats</h1>
      <div className="relative">
        <div className="flex h-screen pb-10 bg-background">
          {/* Sidebar */}
          <div className="w-80 border-r border-border flex-shrink-0">
            <ChatSidebar
              chats={chats}
              selectedChatId={selectedChatId}
              onChatSelect={setSelectedChatId}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <ChatArea
              chat={selectedChat}
              messages={messages}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
