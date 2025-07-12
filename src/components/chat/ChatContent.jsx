import React, { useRef, useEffect, useCallback, useState } from "react";
import { MessagesLoading } from "../message/MessagesLoading";
import { MessageList } from "@/components/chat/MessageList";
import { useInfiniteMessages } from "@/hooks/useInfiniteMessages";
const ChatContent = ({
  chatId,
  messages,
  messagesLoading,
  user,
  userProfile,
  getSenderData,
  getSenderDisplayName,
}) => {
  const [lastChatId, setLastChatId] = useState("");

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef();
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    const container = messagesContainerRef.current;
    const wasPrepending = messages.length === prevMessagesLengthRef.current;

    if (container && lastChatId !== chatId) {
      container.scrollTop = container.scrollHeight;
      setLastChatId(chatId);
    }
    if (!wasPrepending && container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const { loadingOlder, hasMoreMessages, loadOlderMessages } =
    useInfiniteMessages(chatId);

  const handleScroll = useCallback(() => {
    console.log("🌀 handleScroll triggered");

    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop } = container;

    if (scrollTop === 0 && hasMoreMessages && !loadingOlder) {
      console.log("⬆ Reached top — loading older messages...");
      loadOlderMessages();
    }
  }, [hasMoreMessages, loadingOlder, loadOlderMessages]);

  const renderContent = () => {
    if (!chatId) {
      return (
        <div className="hidden sm:flex items-center justify-center h-full">
          <div className="flex items-center justify-center h-full">
            <div className="border rounded-full px-4 py-1">
              <h1 className="text-sm font-semibold">
                Select a chat to start messaging!
              </h1>
            </div>
          </div>
        </div>
      );
    }

    if (messagesLoading) {
      return <MessagesLoading />;
    }

    if (messages === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="border rounded-full px-4 py-1">
            <h1 className="text-sm font-semibold">
              No messages yet. Start the conversation!
            </h1>
          </div>
        </div>
      );
    }

    return (
      <div
        className="flex-1 overflow-y-auto h-full py-4 px-2"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        <MessageList
          messages={messages}
          user={userProfile}
          messagesLoading={messagesLoading}
          getSenderData={getSenderData}
          getSenderDisplayName={getSenderDisplayName}
          currentUserId={user?.uid}
        />
        <div ref={messagesEndRef} />
      </div>
    );
  };

  return (
    <div className="dark:bg-gray-800 rounded overflow-y-auto flex-1 mt-14 mb-14 flex flex-col justify-end">
      {renderContent()}
    </div>
  );
};

export default ChatContent;
