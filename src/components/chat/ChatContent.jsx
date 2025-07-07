import React, { useRef, useEffect } from "react";
import { MessagesLoading } from "../message/MessagesLoading";
import { MessageList } from "@/components/chat/MessageList";

const ChatContent = ({
  chatId,
  messages,
  messagesLoading,
  user,
  userProfile,
  getSenderData,
  getSenderDisplayName,
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    if (messages.length === 0) {
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
      <div className="flex-1 overflow-y-auto h-full py-4 px-2">
        <MessageList
          messages={messages}
          user={userProfile}
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
