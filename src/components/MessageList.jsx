import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";

export const MessageList = ({
  messages,
  user,
  getSenderData,
  getSenderDisplayName,
  formatTimestamp,
}) => {
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
              <div
                className={`relative max-w-md lg:max-w-lg ${
                  msg.type === "system"
                    ? "bg-white/80 text-gray-600 text-center px-3 py-1.5 rounded-full shadow-sm text-xs"
                    : msg.senderId === user.uid
                    ? `bg-blue-500 text-white px-3 py-2 shadow-sm ${
                        // Telegram-style rounded corners - more rounded on top-left, less on bottom-right
                        "rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md"
                      }`
                    : `bg-white text-gray-800 px-3 py-2 shadow-sm border border-gray-100 ${
                        // Opposite rounding for received messages
                        "rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
                      }`
                }`}
              >
                {msg.type === "system" ? (
                  <p className="text-xs font-medium">{msg.message}</p>
                ) : (
                  <>
                    {/* Header with sender info */}
                    {msg.senderId !== user.uid && (
                      <div className="flex gap-1.5 text-xs items-center mb-1">
                        {getSenderDisplayName(msg.senderId) && (
                          <p className="capitalize font-semibold text-blue-600">
                            {getSenderDisplayName(msg.senderId)}
                          </p>
                        )}
                        <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                          {getSenderData(msg.senderId)?.department}
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                          {getSenderData(msg.senderId)?.position}
                        </span>
                      </div>
                    )}

                    {/* For sent messages, show department/position differently */}
                    {msg.senderId === user.uid && (
                      <div className="flex gap-1.5 text-xs items-center mb-1 justify-end">
                        <span className="text-[10px] bg-white/20 text-white rounded-full px-2 py-0.5 font-medium">
                          {getSenderData(msg.senderId)?.department}
                        </span>
                        <span className="text-[10px] bg-white/20 text-white rounded-full px-2 py-0.5 font-medium">
                          {getSenderData(msg.senderId)?.position}
                        </span>
                      </div>
                    )}

                    {/* Message content */}
                    <p className="text-sm leading-relaxed mb-1">
                      {msg.message}
                    </p>

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
                              {msg.seen ? (
                                <Icon
                                  icon="solar:check-read-linear"
                                  width="20"
                                  height="20"
                                />
                              ) : (
                                <Icon
                                  icon="ic:round-check"
                                  width="16"
                                  height="16"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
