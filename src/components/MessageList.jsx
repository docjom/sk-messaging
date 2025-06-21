import React from "react";
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
          <div className="mb-2">
            <img
              src={fileData.url}
              alt={fileData.name}
              className="rounded-t-lg max-w-full h-auto cursor-pointer"
              onClick={() => window.open(fileData.url, "_blank")}
            />
          </div>
        )}

        {isVideo && (
          <div className="mb-2">
            <video
              src={fileData.url}
              controls
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        )}

        {!isImage && !isVideo && (
          <div className="border rounded-t-lg p-3 bg-gray-50 mb-2">
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
          </div>
        )}

        {message.message && (
          <p className="text-sm text-white px-2">{message.message}</p>
        )}
        <div
          className={`flex items-center gap-1 pr-2 ${
            message.senderId === user.uid ? "justify-end" : "justify-start"
          }`}
        >
          <p
            className={`text-[10px] ${
              message.senderId === user.uid ? "text-white/70" : "text-gray-400"
            }`}
          >
            {formatTimestamp(message.timestamp)}
          </p>
          {/* Read status indicators for sent messages (optional) */}
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
      </div>
    );
  };

  return (
    <>
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
                <Avatar className="h-8 w-8">
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
                    <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                      {getSenderData(msg.senderId)?.department}
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full border px-2 py-0.5 font-medium">
                      {getSenderData(msg.senderId)?.position}
                    </span>
                  </div>
                )}

                <div
                  className={`relative max-w-md lg:max-w-lg ${
                    msg.type === "system"
                      ? "bg-white/80 text-gray-600 text-center px-3 py-1.5 rounded-full shadow-sm text-xs"
                      : msg.senderId === user.uid && msg.type !== "file"
                      ? `bg-blue-500 text-white px-3 py-0.5 shadow-sm ${
                          // Telegram-style rounded corners - more rounded on top-left, less on bottom-right
                          "rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md"
                        }`
                      : msg.type === "file" && msg.senderId === user.uid
                      ? `bg-blue-500 text-white pb-1 shadow-sm ${
                          // Telegram-style rounded corners - more rounded on top-left, less on bottom-right
                          "rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md"
                        }`
                      : `bg-white text-gray-800 px-3 py-2 shadow-sm border border-gray-100 ${
                          // Opposite rounding for received messages
                          "rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
                        }`
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
                          {/* For sent messages, show department/position differently
                    {msg.senderId === user.uid && (
                      <div className="flex gap-1.5 text-xs items-center mb-1 justify-end">
                        <span className="text-[10px] bg-white/20 text-white rounded-full px-2 py-0.5 font-medium">
                          {getSenderData(msg.senderId)?.department}
                        </span>
                        <span className="text-[10px] bg-white/20 text-white rounded-full px-2 py-0.5 font-medium">
                          {getSenderData(msg.senderId)?.position}
                        </span>
                      </div>
                    )} */}

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
                            {/* Read status indicators for sent messages (optional) */}
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
    </>
  );
};
