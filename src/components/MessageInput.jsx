import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import EmojiPicker from "emoji-picker-react";
import React, { lazy, Suspense, useState } from "react";

// Lazy load
const LazyEmojiPicker = lazy(() => import("emoji-picker-react"));
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
export const MessageInput = ({
  chatId,
  messagesLoading,
  isMessagesSending,
  setIsFileDialogOpen,
  handleKeyPress,
  handleSendMessage,
  handleCancelEdit,
  message,
  textareaRef,
  replyTo,
  editMessage,
  setMessage,
}) => {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const cursorPos = textareaRef.current.selectionStart;
    const text = message;
    const newText = text.slice(0, cursorPos) + emoji + text.slice(cursorPos);

    setMessage(newText);

    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.selectionEnd = cursorPos + emoji.length;
    }, 0);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-50 shadow-lg sm:ml-64 z-30">
      <div className="px-4 py-2 border-t border-gray-300">
        <div className="flex flex-col gap-1">
          {(replyTo || editMessage) && (
            <div className="flex items-start justify-between bg-gray-100 border-l-4 border-blue-500 px-3 py-2 rounded-t-md w-full mb-1">
              <div className="text-sm text-gray-800 max-w-[80%]">
                <span className="font-medium text-blue-600">
                  {editMessage ? (
                    <>
                      <Icon
                        icon="solar:pen-bold"
                        className="inline mr-1"
                        width="14"
                        height="14"
                      />
                      Editing message
                    </>
                  ) : (
                    <>Replying to {replyTo?.name || "Unknown"}</>
                  )}
                </span>
                <div className="truncate">
                  {editMessage ? (
                    <span className="text-gray-600">
                      {editMessage.message || "No content"}
                    </span>
                  ) : (
                    <>
                      {replyTo?.message || (
                        <>
                          {replyTo?.fileData && (
                            <div className="p-2 bg-white rounded border flex items-center gap-2">
                              {replyTo?.fileData.type?.startsWith("image/") ? (
                                <div className="flex items-center gap-2">
                                  <Icon
                                    icon="solar:gallery-bold"
                                    className="text-blue-500"
                                    width="16"
                                    height="16"
                                  />
                                  <span className="text-xs text-gray-600">
                                    Image: {replyTo?.fileData.name}
                                  </span>
                                </div>
                              ) : replyTo?.fileData.type?.startsWith(
                                  "video/"
                                ) ? (
                                <div className="flex items-center gap-2">
                                  <Icon
                                    icon="solar:videocamera-bold"
                                    className="text-red-500"
                                    width="16"
                                    height="16"
                                  />
                                  <span className="text-xs text-gray-600">
                                    Video: {replyTo?.fileData.name}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Icon
                                    icon="solar:document-bold"
                                    className="text-gray-500"
                                    width="16"
                                    height="16"
                                  />
                                  <span className="text-xs text-gray-600">
                                    File: {replyTo?.fileData.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-red-500 transition text-sm"
              >
                <Icon icon="mdi:close" width="18" height="18" />
              </button>
            </div>
          )}

          <div className="flex justify-center items-end gap-2">
            {!editMessage && (
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-blue-500 border"
                  onClick={() => setIsFileDialogOpen(true)}
                  disabled={!chatId || messagesLoading || isMessagesSending}
                >
                  <Icon icon="solar:file-send-bold" width="24" height="24" />
                </Button>
              </div>
            )}

            <textarea
              className="flex-1 p-2 outline-none rounded-l-lg resize-none min-h-[40px] max-h-32 overflow-y-auto"
              value={message}
              ref={textareaRef}
              required
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                editMessage ? "Edit your message..." : "Write a message..."
              }
              disabled={messagesLoading || isMessagesSending}
              rows={1}
              style={{ height: "auto", minHeight: "40px" }}
              onInput={(e) => {
                if (e.target.value === "") {
                  e.target.style.height = "40px";
                } else {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 128) + "px";
                }
              }}
            />

            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 rounded-full bg-gray-200 hover:bg-gray-300 text-blue-500 transition"
                >
                  <Icon
                    icon="solar:emoji-funny-circle-broken"
                    width="20"
                    height="20"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Suspense
                  fallback={
                    <div className="p-2 text-sm text-gray-500">
                      Loading emojis...
                    </div>
                  }
                >
                  <LazyEmojiPicker onEmojiClick={handleEmojiClick} />
                </Suspense>
              </PopoverContent>
            </Popover>

            <button
              onClick={handleSendMessage}
              className={`p-2 rounded-full ${
                !message.trim()
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : editMessage
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 text-white"
              }`}
              disabled={!message.trim() || messagesLoading || isMessagesSending}
            >
              <Icon
                icon={
                  editMessage
                    ? "solar:check-circle-bold"
                    : "material-symbols:send-rounded"
                }
                width="20"
                height="20"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
