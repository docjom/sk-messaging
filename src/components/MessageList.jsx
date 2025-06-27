import React, { useEffect, useRef, useState, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { EmojiSet } from "./EmojiSet";
import { ReplyMessageDisplay } from "./ReplyMessage";
import { useMessageActionStore } from "../stores/useMessageActionStore";
import { FileMessage } from "./FileMessage";
import { EmojiReactions } from "./EmojiReactions";
import { formatMessageWithLinks, formatFileSize } from "../composables/scripts";

export const MessageList = ({
  messages,
  user,
  getSenderData,
  getSenderDisplayName,
  formatTimestamp,
  chatId,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollTimeoutRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const [loadingStates, setLoadingStates] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState(null);
  const { setEditMessage, setReplyTo } = useMessageActionStore();

  const scrollToBottomInstant = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "auto",
      block: "end",
    });
  }, []);

  const scrollToBottomSmooth = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, []);

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 150;
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    setIsUserScrolling(true);

    const nearBottom = isNearBottom();
    setShouldAutoScroll(nearBottom);

    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  }, [isNearBottom]);

  const handleImageLoad = useCallback((messageId) => {
    setLoadingStates((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], imageLoaded: true },
    }));
  }, []);

  const handleVideoLoad = useCallback((messageId) => {
    setLoadingStates((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], videoLoaded: true },
    }));
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setShouldAutoScroll(true);
      setIsUserScrolling(false);
      lastMessageCountRef.current = messages.length;

      setTimeout(() => {
        scrollToBottomInstant();
      }, 0);
    }
  }, []);

  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessages = currentMessageCount > lastMessageCountRef.current;

    if (hasNewMessages && currentMessageCount > 0) {
      lastMessageCountRef.current = currentMessageCount;

      if (shouldAutoScroll && !isUserScrolling) {
        setTimeout(() => {
          scrollToBottomSmooth();
        }, 50);
      }
    }
  }, [
    messages.length,
    shouldAutoScroll,
    isUserScrolling,
    scrollToBottomSmooth,
  ]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        container.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto scroll-smooth"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex mb-2 ${
            msg.type === "system"
              ? "justify-center"
              : msg.senderId === user.uid
              ? "justify-end"
              : "justify-start"
          }`}
        >
          {/* Options button for current user messages */}
          {msg.senderId === user.uid && msg.type !== "system" && (
            <div className="relative">
              <Popover
                open={openPopoverId === msg.id}
                onOpenChange={(open) => setOpenPopoverId(open ? msg.id : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={"ghost"}
                    size={"sm"}
                    className="mr-2 rounded-full border"
                  >
                    <Icon
                      icon="solar:menu-dots-bold-duotone"
                      width="24"
                      height="24"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-1">
                  <Button
                    onClick={() => {
                      setReplyTo({
                        messageId: msg.id,
                        message: msg.message,
                        senderId: msg.senderId,
                        fileData: msg.fileData,
                        name: getSenderDisplayName(msg.senderId),
                      });
                      setOpenPopoverId(null);
                    }}
                    variant={"ghost"}
                    size={"sm"}
                    className="flex w-full justify-start gap-2 items-center"
                  >
                    <Icon icon="solar:reply-broken" width="24" height="24" />
                    Reply
                  </Button>
                  <Button
                    onClick={() => {
                      setOpenPopoverId(null);
                      navigator.clipboard.writeText(msg.message);
                    }}
                    variant={"ghost"}
                    size={"sm"}
                    className="flex w-full justify-start gap-2 items-center"
                  >
                    <Icon icon="solar:copy-broken" width="24" height="24" />
                    Copy
                  </Button>

                  <Button
                    onClick={() => {
                      setEditMessage({
                        messageId: msg.id,
                        message: msg.message,
                        senderId: msg.senderId,
                        fileData: msg.fileData,
                        name: getSenderDisplayName(msg.senderId),
                      });
                      setOpenPopoverId(null);
                    }}
                    variant={"ghost"}
                    size={"sm"}
                    className="flex w-full justify-start gap-2 items-center"
                  >
                    <Icon
                      icon="solar:gallery-edit-broken"
                      width="24"
                      height="24"
                    />
                    Edit
                  </Button>

                  <div className="absolute w-52 -top-13  left-0  mt-2">
                    <div className="relative">
                      <EmojiSet
                        messageId={msg.id}
                        userId={user.uid}
                        chatId={chatId}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {/* ------------------------------------------------ */}
          <div>
            <div className="flex items-end gap-1.5">
              {msg.senderId !== user.uid && msg.type !== "system" && (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={getSenderData(msg.senderId)?.photoURL} />
                  <AvatarFallback>P</AvatarFallback>
                </Avatar>
              )}

              <div>
                {/* Header with sender info */}
                {msg.senderId !== user.uid && msg.type !== "system" && (
                  <div className="flex gap-1.5 text-xs items-center mb-1">
                    {getSenderDisplayName(msg.senderId) && (
                      <p className="capitalize font-semibold text-blue-600">
                        {getSenderDisplayName(msg.senderId)}
                      </p>
                    )}
                    {getSenderData(msg.senderId)?.department && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                        {getSenderData(msg.senderId)?.department}
                      </span>
                    )}
                    {getSenderData(msg.senderId)?.position && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full border px-2 py-0.5 font-medium">
                        {getSenderData(msg.senderId)?.position}
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`relative max-w-md lg:max-w-lg ${
                    msg.type === "system"
                      ? "bg-white/80 text-gray-600 text-center px-3 py-1.5 rounded-full shadow-sm text-xs"
                      : msg.senderId === user.uid && msg.type !== "file"
                      ? `bg-blue-500 text-white px-3 py-0.5 shadow-sm ${"rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-lg"}`
                      : msg.type === "file" && msg.senderId === user.uid
                      ? `bg-blue-500 text-white shadow-sm ${"rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-lg"}`
                      : msg.type === "file" && msg.senderId !== user.uid
                      ? `bg-white text-gray-800 shadow-sm ${"rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-lg"}`
                      : `bg-white text-gray-800 px-3 py-2 shadow-sm border border-gray-100 ${"rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"}`
                  }`}
                >
                  <ReplyMessageDisplay
                    message={msg}
                    getSenderDisplayName={getSenderDisplayName}
                  />
                  {msg.type === "file" ? (
                    <FileMessage
                      message={msg}
                      handleImageLoad={handleImageLoad}
                      handleVideoLoad={handleVideoLoad}
                      loadingStates={loadingStates}
                      user={user}
                      formatTimestamp={formatTimestamp}
                      formatFileSize={formatFileSize}
                      formatMessageWithLinks={formatMessageWithLinks}
                      getSenderData={getSenderData}
                    />
                  ) : (
                    <>
                      {msg.type === "system" ? (
                        <p className="text-xs font-medium">{msg.message}</p>
                      ) : (
                        <>
                          {/* Message content */}
                          <div
                            dangerouslySetInnerHTML={{
                              __html: formatMessageWithLinks(
                                msg.message,
                                msg.senderId,
                                user.uid
                              ),
                            }}
                            className="text-sm max-w-52 sm:max-w-80 whitespace-pre-wrap break-words "
                          />

                          <div
                            className={`flex items-center gap-1 ${
                              msg.senderId === user.uid
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            {/* emoji reactions to message */}
                            <EmojiReactions
                              msg={msg}
                              getSenderData={getSenderData}
                              user={user}
                            />
                            <p
                              className={`text-[10px] ${
                                msg.senderId === user.uid
                                  ? "text-white/70"
                                  : "text-gray-400"
                              }`}
                            >
                              {formatTimestamp(msg.timestamp)}
                            </p>
                            {msg.senderId === user.uid && (
                              <div className="flex">
                                {msg.senderId === user.uid && (
                                  <div className="flex">
                                    {msg.status === "sending" ? (
                                      <Icon
                                        icon="ic:round-access-time"
                                        width="14"
                                        height="14"
                                        className="animate-pulse"
                                      />
                                    ) : msg.status === "sent" && !msg.seen ? (
                                      <Icon
                                        icon="ic:round-check"
                                        width="16"
                                        height="16"
                                      />
                                    ) : msg.seen ? (
                                      <Icon
                                        icon="solar:check-read-linear"
                                        width="20"
                                        height="20"
                                      />
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Options button for non-current user messages */}
              {msg.senderId !== user.uid && msg.type !== "system" && (
                <>
                  <Popover
                    open={openPopoverId === msg.id}
                    onOpenChange={(open) =>
                      setOpenPopoverId(open ? msg.id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"ghost"}
                        size={"sm"}
                        className="mr-2 rounded-full border"
                      >
                        <Icon
                          icon="solar:menu-dots-bold-duotone"
                          width="24"
                          height="24"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 p-1">
                      <Button
                        onClick={() => {
                          setReplyTo({
                            messageId: msg.id,
                            message: msg.message,
                            senderId: msg.senderId,
                            fileData: msg.fileData,
                            name: getSenderDisplayName(msg.senderId),
                          });
                          setOpenPopoverId(null);
                        }}
                        variant={"ghost"}
                        size={"sm"}
                        className="flex w-full justify-start gap-2 items-center"
                      >
                        <Icon
                          icon="solar:reply-broken"
                          width="24"
                          height="24"
                        />
                        Reply
                      </Button>
                      <Button
                        onClick={() => {
                          setOpenPopoverId(null);
                          navigator.clipboard.writeText(msg.message);
                        }}
                        variant={"ghost"}
                        size={"sm"}
                        className="flex w-full justify-start gap-2 items-center"
                      >
                        <Icon icon="solar:copy-broken" width="24" height="24" />
                        Copy
                      </Button>

                      <div className="absolute w-52 -top-13 left-0 mb-2">
                        <div className="relative">
                          <EmojiSet
                            messageId={msg.id}
                            userId={user.uid}
                            chatId={chatId}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
