import React, { useRef, useEffect, useCallback, memo } from "react";
import { MessagesLoading } from "../message/MessagesLoading";
import { MessageList } from "@/components/chat/MessageList";
import { useMessageActionStore } from "@/stores/useMessageActionStore";

const MemoizedMessageList = memo(MessageList);

const ChatContent = ({
  chatId,
  messages,
  messagesLoading,
  loadOlderMessages,
  user,
  userProfile,
  getSenderData,
  getSenderDisplayName,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const prevMessagesLengthRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const isLoadingOlderRef = useRef(false);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const { topicId } = useMessageActionStore();

  // Reset refs when chat or topic changes
  useEffect(() => {
    scrollPositionRef.current = 0;
    prevMessagesLengthRef.current = 0;
    isInitialLoadRef.current = true;
    isLoadingOlderRef.current = false;
    isUserScrollingRef.current = false;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  }, [chatId, topicId]);

  // Handle scroll behavior when messages change
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !messages?.length) return;

    const currentMessagesLength = messages.length;
    const prevMessagesLength = prevMessagesLengthRef.current;

    // Initial load - immediately position at bottom (no animation, no blinking)
    if (isInitialLoadRef.current) {
      // Set scroll position immediately without any delay or animation
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
    }
    // Loading older messages - maintain scroll position
    else if (
      isLoadingOlderRef.current &&
      currentMessagesLength > prevMessagesLength
    ) {
      const prevScrollHeight = scrollPositionRef.current;
      const target = container.scrollHeight - prevScrollHeight;
      // Set immediately
      container.scrollTop = target;
      // Re-apply after layout to counter async renders (images, media) and any accidental bottom-stick
      requestAnimationFrame(() => {
        container.scrollTop = target;
      });
      setTimeout(() => {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      }, 80);
      isLoadingOlderRef.current = false;
    }
    // New message arrived - scroll to bottom only if user was at bottom
    else if (
      currentMessagesLength > prevMessagesLength &&
      !isLoadingOlderRef.current
    ) {
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;

      if (isAtBottom) {
        // Use smooth scrolling for new messages only when already near bottom
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }

    prevMessagesLengthRef.current = currentMessagesLength;
  }, [messages]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Mark that user is actively scrolling
    isUserScrollingRef.current = true;

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset scrolling flag after user stops scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);

    // Load older messages when scrolled to top
    if (
      container.scrollTop === 0 &&
      !isLoadingOlderRef.current &&
      !messagesLoading
    ) {
      scrollPositionRef.current = container.scrollHeight;
      isLoadingOlderRef.current = true;
      loadOlderMessages();
    }
  }, [loadOlderMessages, messagesLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const renderContent = () => {
    if (!chatId) {
      return (
        <div className="hidden sm:flex items-center justify-center h-full">
          <div className="border rounded-full px-4 py-1">
            <h1 className="text-sm font-semibold">
              Select a chat to start messaging!
            </h1>
          </div>
        </div>
      );
    }

    if (messagesLoading && !messages?.length) {
      return <MessagesLoading />;
    }

    return (
      <div
        className="flex-1 overflow-y-auto h-full py-4 px-2 messages-container"
        style={{ scrollBehavior: "auto" }}
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        <MemoizedMessageList
          messages={messages}
          user={userProfile}
          messagesLoading={messagesLoading}
          getSenderData={getSenderData}
          getSenderDisplayName={getSenderDisplayName}
          currentUserId={user?.uid}
          containerRef={messagesContainerRef}
          endRef={messagesEndRef}
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

export default memo(ChatContent);
