import { Icon } from "@iconify/react";
import React, { lazy, Suspense, useState, useCallback, memo } from "react";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { SendButton } from "./MessageInputUi/SendButton";
import { useUserStore } from "@/stores/useUserStore";
// Lazy load
const LazyEmojiPicker = lazy(() => import("emoji-picker-react"));
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTypingForChat } from "../hooks/userTypingForChat";

const MessageInput = memo(
  ({
    chatId,
    messagesLoading,
    isMessagesSending,
    setIsFileDialogOpen,
    handleSendMessage,
    handleCancelEdit,
    message,
    textareaRef,
    handleKeyPress,
    replyTo,
    editMessage,
    setMessage,
  }) => {
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);


    const { setTyping } = useTypingForChat(chatId);
    const user = useUserStore((s) => s.user);
    // Use the store directly to avoid selector issues
    const pastedImage = useMessageActionStore((state) => state.pastedImage);
    const setPastedImage = useMessageActionStore(
      (state) => state.setPastedImage
    );
    const clearPastedImage = useMessageActionStore(
      (state) => state.clearPastedImage
    );



    // Memoize event handlers - FIXED dependencies
    const handleEmojiClick = useCallback(
      (emojiData) => {
        const emoji = emojiData.emoji;
        const cursorPos = textareaRef.current?.selectionStart || 0;
        const text = message;
        const newText =
          text.slice(0, cursorPos) + emoji + text.slice(cursorPos);

        setMessage(newText);

        // Use requestAnimationFrame instead of setTimeout
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionEnd = cursorPos + emoji.length;
          }
        });
      },
      [message, setMessage]
    ); // Removed textareaRef from deps

    const handlePaste = useCallback((e) => {
      const items = e.clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = item.getAsFile();

          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setPastedImage({
                file: file,
                preview: event.target.result,
                name: `${Date.now()}.${file.type.split("/")[1]}`,
                type: file.type,
              });
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    }, []);

    const handleCancelPastedImage = useCallback(() => {
      clearPastedImage();
    }, []);

    const handleFileDialogOpen = useCallback(() => {
      setIsFileDialogOpen(true);
    }, [setIsFileDialogOpen]);

    const handleTextareaInput = useCallback((e) => {
      if (e.target.value === "") {
        e.target.style.height = "40px";
      } else {
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
      }
    }, []);

    const handleTextareaChange = useCallback(
      (e) => {
        const newMessage = e.target.value;
        setMessage(newMessage);
        if (newMessage.trim() && user?.uid && user?.displayName && chatId) {
          setTyping(user.uid, user.displayName);
        }
      },
      [setMessage, setTyping, user?.uid, user?.displayName, chatId]
    );

    const isInputDisabled = messagesLoading || isMessagesSending;
    const isFileButtonDisabled =
      !chatId || messagesLoading || isMessagesSending;

    return (
      <div className="fixed bottom-0 left-0 right-0  shadow-lg sm:ml-64 z-30">
        <div className="px-4 py-2 border-t border-gray-300 dark:border-gray-700">
          <div className="flex flex-col gap-1">
            {/* Display pasted image */}
            {pastedImage && (
              <div className="flex justify-between border p-2 rounded-2xl items-start gap-2 ">
                <div className="flex gap-2 items-start">
                  <div className="relative">
                    <img
                      src={pastedImage.preview}
                      alt="Pasted image"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-semibold text-sm">{pastedImage.name}</p>
                    <p className="text-xs text-gray-500">
                      {(pastedImage.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancelPastedImage}
                  className="text-gray-500 hover:text-red-500 transition text-sm"
                >
                  <Icon icon="mdi:close" width="18" height="18" />
                </button>
              </div>
            )}

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
                              <div className="p-2  rounded border flex items-center gap-2">
                                {replyTo?.fileData.type?.startsWith(
                                  "image/"
                                ) ? (
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
                  <button
                    className="text-blue-500 p-2 rounded-full border"
                    onClick={handleFileDialogOpen}
                    disabled={isFileButtonDisabled}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="m19.352 7.617l-3.96-3.563c-1.127-1.015-1.69-1.523-2.383-1.788L13 5c0 2.357 0 3.536.732 4.268S15.643 10 18 10h3.58c-.362-.704-1.012-1.288-2.228-2.383"
                      />
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M10 22h4c3.771 0 5.657 0 6.828-1.172S22 17.771 22 14v-.437c0-.873 0-1.529-.043-2.063h-4.052c-1.097 0-2.067 0-2.848-.105c-.847-.114-1.694-.375-2.385-1.066c-.692-.692-.953-1.539-1.067-2.386c-.105-.781-.105-1.75-.105-2.848l.01-2.834q0-.124.02-.244C11.121 2 10.636 2 10.03 2C6.239 2 4.343 2 3.172 3.172C2 4.343 2 6.229 2 10v4c0 3.771 0 5.657 1.172 6.828S6.229 22 10 22m-.987-9.047a.75.75 0 0 0-1.026 0l-2 1.875a.75.75 0 0 0 1.026 1.094l.737-.69V18.5a.75.75 0 0 0 1.5 0v-3.269l.737.691a.75.75 0 0 0 1.026-1.094z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <textarea
                className="flex-1 p-2 outline-none rounded-l-lg resize-none min-h-[40px] max-h-32 overflow-y-auto"
                value={message}
                ref={textareaRef}
                required
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                onPaste={handlePaste}
                placeholder={
                  editMessage ? "Edit your message..." : "Write a message..."
                }
                disabled={isInputDisabled}
                rows={1}
                style={{ height: "auto", minHeight: "40px" }}
                onInput={handleTextareaInput}
              />

              <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-700  hover:bg-gray-300 text-blue-500 transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                    >
                      <g fill="none">
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.5"
                          d="M8.913 15.934c1.258.315 2.685.315 4.122-.07s2.673-1.099 3.605-2.001"
                        />
                        <ellipse
                          cx="14.509"
                          cy="9.774"
                          fill="currentColor"
                          rx="1"
                          ry="1.5"
                          transform="rotate(-15 14.51 9.774)"
                        />
                        <ellipse
                          cx="8.714"
                          cy="11.328"
                          fill="currentColor"
                          rx="1"
                          ry="1.5"
                          transform="rotate(-15 8.714 11.328)"
                        />
                        <path
                          stroke="currentColor"
                          strokeWidth="1.5"
                          d="m13 16l.478.974a1.5 1.5 0 1 0 2.693-1.322l-.46-.935"
                        />
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.5"
                          d="M4.928 4.927A9.95 9.95 0 0 1 9.412 2.34C14.746.91 20.23 4.077 21.659 9.411c1.43 5.335-1.736 10.818-7.07 12.248S3.77 19.922 2.34 14.588a9.95 9.95 0 0 1-.002-5.176"
                        />
                      </g>
                    </svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Suspense
                    fallback={
                      <div className="p-2 text-sm text-gray-500">
                        Loading emojis...
                      </div>
                    }
                  >
                    <LazyEmojiPicker
                      height={400}
                      width={300}
                      onEmojiClick={handleEmojiClick}
                    />
                  </Suspense>
                </PopoverContent>
              </Popover>

              <SendButton
                handleSendMessage={handleSendMessage}
                message={message}
                messagesLoading={messagesLoading}
                isMessagesSending={isMessagesSending}
                editMessage={editMessage}
                pastedImage={pastedImage}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MessageInput.displayName = "MessageInput";

export { MessageInput };
