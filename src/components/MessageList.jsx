import React, { useEffect, useRef, useState, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

export const MessageList = ({
  messages,
  user,
  getSenderData,
  getSenderDisplayName,
  formatTimestamp,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollTimeoutRef = useRef(null);
  const lastMessageCountRef = useRef(0);

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderFileMessage = (message) => {
    const { fileData } = message;
    if (!fileData) return null;

    const isImage = fileData.type.startsWith("image/");
    const isVideo = fileData.type.startsWith("video/");
    const isPdf = fileData.type.includes("pdf");

    const downloadFile = (url, filename) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="max-w-sm">
        {isImage && (
          <div className={` relative${message.message ? "mb-2" : ""}`}>
            <img
              src={fileData.url}
              alt={fileData.name}
              className={`  w-full h-auto max-h-80 object-cover cursor-pointer ${
                message.message !== "" ? " rounded-t-lg" : "rounded-lg"
              }`}
              onClick={() => window.open(fileData.url, "_blank")}
            />
            {!message.message && (
              <div
                className={`absolute   border-gray-200/50 border backdrop-blur-sm rounded-full max-w-32 gap-1 px-2 ${
                  message.senderId === user.uid
                    ? "justify-end bottom-1 right-1 bg-gray-200"
                    : "justify-start top-1 left-1 bg-gray-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <p
                    className={`text-xs py-0.5 ${
                      message.senderId === user.uid
                        ? "text-gray-800"
                        : "text-gray-800"
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </p>

                  {message.senderId === user.uid && (
                    <div className="flex text-gray-800">
                      {message.senderId === user.uid && (
                        <div className="flex">
                          {message.status === "sending" ? (
                            <Icon
                              icon="ic:round-access-time"
                              width="14"
                              height="14"
                              className="animate-pulse"
                            />
                          ) : message.status === "sent" && !message.seen ? (
                            <Icon
                              icon="ic:round-check"
                              width="16"
                              height="16"
                            />
                          ) : message.seen ? (
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
              </div>
            )}
          </div>
        )}

        {isVideo && (
          <div className="mb-2 relative">
            <video
              src={fileData.url}
              controls
              className={`  w-full h-auto max-h-80 object-cover cursor-pointer ${
                message.message !== "" ? " rounded-t-lg" : "rounded-lg"
              }`}
            />
            {!message.message && (
              <div
                className={`absolute   border-gray-200/50 border backdrop-blur-sm rounded-full max-w-32 gap-1 px-2 ${
                  message.senderId === user.uid
                    ? "justify-end bottom-1 right-1 bg-gray-500/50"
                    : "justify-start top-1 left-1 bg-gray-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <p
                    className={`text-xs py-0.5 ${
                      message.senderId === user.uid
                        ? "text-white/70"
                        : "text-gray-800"
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </p>

                  {message.senderId === user.uid && (
                    <div className="flex">
                      {message.senderId === user.uid && (
                        <div className="flex">
                          {message.status === "sending" ? (
                            <Icon
                              icon="ic:round-access-time"
                              width="14"
                              height="14"
                              className="animate-pulse"
                            />
                          ) : message.status === "sent" && !message.seen ? (
                            <Icon
                              icon="ic:round-check"
                              width="16"
                              height="16"
                            />
                          ) : message.seen ? (
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
              </div>
            )}
          </div>
        )}

        {!isImage && !isVideo && (
          <div
            className={`  border relative  px-3 pt-3  bg-gray-50 mb-2 ${
              message.message !== "" ? " rounded-t-lg pb-3" : "rounded-lg pb-5"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-blue-500">
                {isPdf ? (
                  <Icon icon="solar:file-text-bold" width="24" height="24" />
                ) : (
                  <Icon icon="solar:file-bold" width="24" height="24" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileData.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileData.size)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => downloadFile(fileData.url, fileData.name)}
                className="text-blue-500 hover:text-blue-700"
              >
                <Icon icon="solar:download-bold" width="16" height="16" />
              </Button>
            </div>
            {!message.message && (
              <div
                className={`absolute bottom-1 right-1  border-gray-200/50 border backdrop-blur-sm rounded-full max-w-32 gap-1 px-2 ${
                  message.senderId === user.uid
                    ? "justify-end  bg-gray-500/50"
                    : "justify-start  bg-gray-500/20"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <p
                    className={`text-xs py-0.5 ${
                      message.senderId === user.uid
                        ? "text-white/70"
                        : "text-gray-800"
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </p>
                  {message.senderId === user.uid && (
                    <div className="flex">
                      {message.senderId === user.uid && (
                        <div className="flex">
                          {message.status === "sending" ? (
                            <Icon
                              icon="ic:round-access-time"
                              width="14"
                              height="14"
                              className="animate-pulse"
                            />
                          ) : message.status === "sent" && !message.seen ? (
                            <Icon
                              icon="ic:round-check"
                              width="16"
                              height="16"
                            />
                          ) : message.seen ? (
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
              </div>
            )}
          </div>
        )}

        {message.message && (
          <>
            <p
              className={`text-sm px-2 ${
                message.senderId === user.uid ? "text-white" : "text-gray-800"
              }`}
            >
              {message.message}
            </p>
            <div
              className={`flex items-center gap-1 px-2 ${
                message.senderId === user.uid ? "justify-end" : "justify-start"
              }`}
            >
              <p
                className={`text-[10px] ${
                  message.senderId === user.uid
                    ? "text-white/70"
                    : "text-gray-400"
                }`}
              >
                {formatTimestamp(message.timestamp)}
              </p>

              {message.senderId === user.uid && (
                <div className="flex">
                  {message.senderId === user.uid && (
                    <div className="flex">
                      {message.status === "sending" ? (
                        <Icon
                          icon="ic:round-access-time"
                          width="14"
                          height="14"
                          className="animate-pulse"
                        />
                      ) : message.status === "sent" && !message.seen ? (
                        <Icon icon="ic:round-check" width="16" height="16" />
                      ) : message.seen ? (
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
      </div>
    );
  };

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
                  {msg.type === "file" ? (
                    renderFileMessage(msg)
                  ) : (
                    <>
                      {msg.type === "system" ? (
                        <p className="text-xs font-medium">{msg.message}</p>
                      ) : (
                        <>
                          {/* Message content */}
                          <p className="text-sm ">{msg.message}</p>

                          {/* Timestamp - Telegram style */}
                          <div
                            className={`flex items-center gap-1 ${
                              msg.senderId === user.uid
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
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
            </div>
          </div>
        </div>
      ))}
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
};
