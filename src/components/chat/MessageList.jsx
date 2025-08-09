import React, { useRef, useState, useCallback, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import { ReplyMessageDisplay } from "../message/ReplyMessage";
import { useMessageActionStore } from "../../stores/useMessageActionStore";
import { useUserStore } from "@/stores/useUserStore";
import { FileMessage } from "../message/FileMessage";
import { EmojiReactions } from "../emoji/EmojiReactions";
import { formatMessageWithLinks } from "../../composables/scripts";
import { toast } from "sonner";
import {
  doc,
  serverTimestamp,
  getDoc,
  addDoc,
  writeBatch,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { formatTimestamp } from "../../composables/scripts";
import ForwardMessageDialog from "../message/ForwardMessageDialog";
import { MessageOptionsMenu } from "../message/MessageOptionsMenu";
import { getRefs, getUserRef } from "@/utils/firestoreRefs";

export const MessageList = ({
  getSenderData,
  getSenderDisplayName,
  messages,
  messagesLoading,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [openPopoverId, setOpenPopoverId] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const { setEditMessage, setReplyTo, chatId, users, topicId } =
    useMessageActionStore();
  const isUserStickyRef = useRef(true);

  const userProfile = useUserStore((s) => s.userProfile);
  const user = userProfile;
  const currentUserId = user?.uid;

  // Clear highlight after 3 seconds
  useEffect(() => {
    if (highlightedMessageId) {
      const timer = setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId]);

  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Helper function to determine if messages should be grouped
  const shouldGroupMessage = (currentMsg, previousMsg) => {
    if (!previousMsg) return false;
    if (currentMsg.senderId !== previousMsg.senderId) return false;
    if (currentMsg.type === "system" || previousMsg.type === "system")
      return false;

    // Handle different timestamp formats (Firebase Timestamp, Date, or milliseconds)
    const getCurrentTime = (timestamp) => {
      if (!timestamp) return 0;
      if (timestamp.seconds) return timestamp.seconds * 1000; // Firebase Timestamp
      if (timestamp instanceof Date) return timestamp.getTime(); // Date object
      if (typeof timestamp === "number") return timestamp; // Already in milliseconds
      return Date.parse(timestamp) || 0; // Try to parse string
    };

    const currentTime = getCurrentTime(currentMsg.timestamp);
    const previousTime = getCurrentTime(previousMsg.timestamp);

    const timeDiffMs = Math.abs(currentTime - previousTime);
    const maxGroupingTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    return timeDiffMs < maxGroupingTime;
  };

  // Helper function to check if this is the last message in a group
  const isLastInGroup = (currentMsg, nextMsg) => {
    if (!nextMsg) return true;
    return !shouldGroupMessage(nextMsg, currentMsg);
  };

  // Helper function to check if this is the first message in a group
  const isFirstInGroup = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    return !shouldGroupMessage(currentMsg, previousMsg);
  };

  // Function to scroll to and highlight a specific message (keep smooth here)
  const scrollToMessage = useCallback((messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setHighlightedMessageId(messageId);
    } else {
      toast.error("Message not found in current view");
    }
  }, []);

  // Handle clicking on a reply message
  const handleReplyClick = useCallback(
    (replyToMessageId) => {
      if (replyToMessageId) {
        scrollToMessage(replyToMessageId);
      }
    },
    [scrollToMessage]
  );

  const handleForwardMessage = (messageId) => {
    const message = messages.find((msg) => msg.id === messageId);
    setSelectedMessage(message);
    setForwardDialogOpen(true);
    setOpenPopoverId(null);
  };

  const handlePinMessage = async (messageId) => {
    try {
      const { messageRef, chatRef, pinnedMessagesRef, messageCollectionRef } =
        getRefs({
          chatId,
          topicId,
          messageId,
        });

      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) return console.error("Message not found");

      const messageData = messageSnap.data();

      await updateDoc(messageRef, {
        pinned: true,
        pinnedAt: serverTimestamp(),
      });

      const userRef = getUserRef(currentUserId);
      const userSnap = await getDoc(userRef);
      const name = userSnap.data()?.displayName || "Someone";

      const batch = writeBatch(db);
      batch.update(chatRef, {
        lastMessage: `${name} pinned a message`,
        lastMessageTime: serverTimestamp(),
        lastSenderName: name,
      });

      batch.set(doc(messageCollectionRef), {
        senderId: currentUserId,
        message: `${name} pinned a message`,
        timestamp: serverTimestamp(),
        type: "system",
      });

      await addDoc(pinnedMessagesRef, {
        originalMessageId: messageId,
        senderId: messageData.senderId,
        message: messageData.message,
        timestamp: messageData.timestamp,
        type: messageData.type || null,
        fileData: messageData.fileData || null,
        forwarded: messageData.forwarded || false,
        forwardedAt: messageData.forwardedAt || null,
        pinnedBy: currentUserId,
        pinnedAt: serverTimestamp(),
      });

      await batch.commit();
      setOpenPopoverId(null);
      // Keep sticky after action
      isUserStickyRef.current = true;
    } catch (err) {
      console.error("Failed to pin message:", err);
    }
  };

  const handleRemovePinMessage = async (messageId) => {
    try {
      const { messageRef, pinnedMessagesRef, pinnedMessageDoc, chatRef } =
        getRefs({ chatId, topicId, messageId });

      const q = query(
        pinnedMessagesRef,
        where("originalMessageId", "==", messageId)
      );
      const pinnedMessageSnap = await getDocs(q);

      if (pinnedMessageSnap.empty)
        return console.error("Pinned message not found");

      const pinnedMessageId = pinnedMessageSnap.docs[0].id;

      const batch = writeBatch(db);
      batch.update(messageRef, {
        pinned: false,
        pinnedAt: null,
      });
      batch.delete(pinnedMessageDoc(pinnedMessageId));

      const userSnap = await getDoc(getUserRef(currentUserId));
      const name = userSnap.data()?.displayName || "Someone";

      batch.update(chatRef, {
        lastMessage: `${name} unpinned a message`,
        lastMessageTime: serverTimestamp(),
      });

      await batch.commit();
      setOpenPopoverId(null);
      isUserStickyRef.current = true;
    } catch (err) {
      console.error("Error unpinning message:", err);
    }
  };

  const handleBumpMessage = async (messageId) => {
    try {
      const userRef = getUserRef(currentUserId);
      const userSnap = await getDoc(userRef);
      const name = userSnap.data()?.displayName || "Someone";

      const { messageRef, messageCollectionRef, chatRef } = getRefs({
        chatId,
        topicId,
        messageId,
      });

      const originalMsgSnap = await getDoc(messageRef);
      const originalMsg = originalMsgSnap.data();

      if (!originalMsg) throw new Error("Message not found.");

      await addDoc(messageCollectionRef, {
        ...Object.fromEntries(
          Object.entries(originalMsg).filter(([key]) => key !== "reactions")
        ),
        bumpedFrom: messageId,
        timestamp: serverTimestamp(),
      });

      await updateDoc(chatRef, {
        lastMessage: `${name} bumped a message`,
        lastMessageTime: serverTimestamp(),
      });

      setOpenPopoverId(null);
      isUserStickyRef.current = true;
    } catch (error) {
      console.error("Error bumping message:", error);
    }
  };

  const copy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast("Text copied!");
      })
      .catch(() => {
        toast.error("Failed to copy");
      });
  };

  const downloadFile = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl, {
        method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        mode: "cors",
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = imageUrl.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const copyImageToClipboard = async (imageUrl) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast.success("Image URL copied to clipboard!");
    } catch (e) {
      toast.error("Failed to copy image");
      console.log(e);
    }
  };

  const handleImageLoad = useCallback((messageId) => {
    setLoadingStates((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], imageLoaded: true },
    }));
    // Re-stick if user is sticky
    if (isUserStickyRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  const handleVideoLoad = useCallback((messageId) => {
    setLoadingStates((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], videoLoaded: true },
    }));
    if (isUserStickyRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b ">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth bg-gradient-to-b  px-2 py-4"
      >
        {messages?.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl px-6 py-4 shadow-lg">
              <div className="text-center">
                <Icon
                  icon="solar:chat-dots-outline"
                  className="mx-auto mb-3 text-blue-400 dark:text-blue-300"
                  width="48"
                  height="48"
                />
                <h1 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  No messages yet
                </h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Start the conversation
                </p>
              </div>
            </div>
          </div>
        )}

        {messages?.map((msg, index) => {
          const previousMsg = index > 0 ? messages[index - 1] : null;
          const nextMsg =
            index < messages.length - 1 ? messages[index + 1] : null;
          const isOwn = msg.senderId === user?.uid;
          const isSystem = msg.type === "system";
          const isFirstMsg = isFirstInGroup(msg, previousMsg);
          const isLastMsg = isLastInGroup(msg, nextMsg);
          const isGrouped = shouldGroupMessage(msg, previousMsg);

          return (
            <React.Fragment key={msg.id}>
              {/* Add subtle separator between message groups */}
              {!isSystem &&
                isFirstMsg &&
                index > 0 &&
                messages[index - 1]?.type !== "system" && (
                  <div className="flex justify-center my-2">
                    <div className="w-12 h-px bg-gray-200/50 dark:bg-gray-600/30"></div>
                  </div>
                )}

              <div
                id={`message-${msg.id}`}
                className={`flex transition-all duration-300 ${
                  highlightedMessageId === msg.id
                    ? "bg-yellow-200/30 dark:bg-yellow-500/20 rounded-lg py-2 -mx-2 px-2"
                    : ""
                } ${
                  isSystem
                    ? "justify-center mb-4"
                    : isOwn
                    ? "justify-end"
                    : "justify-start"
                } ${
                  // Spacing logic for grouping
                  isSystem
                    ? ""
                    : isGrouped
                    ? "mb-0.5" // Tight spacing for grouped messages
                    : isFirstMsg
                    ? "mt-4 mb-0.5" // Extra space before new group
                    : "mb-0.5"
                }`}
              >
                {isSystem ? (
                  // System message styling (like Telegram's service messages)
                  <div className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm text-center px-4 py-2 rounded-full shadow-sm border border-gray-200/30 dark:border-gray-600/30">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {msg.message}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`flex items-end gap-1 max-w-[75%] ${
                      isOwn ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar (only for others and only on last message in group) */}
                    {!isOwn && isLastMsg && (
                      <Avatar className="h-8 w-8 flex-shrink-0 mb-1">
                        <AvatarImage
                          src={getSenderData(msg.senderId)?.photoURL}
                        />
                        <AvatarFallback className="text-xs bg-blue-500 text-white">
                          {getSenderDisplayName(msg.senderId)
                            ?.charAt(0)
                            ?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    {/* Spacer for grouped messages */}
                    {!isOwn && !isLastMsg && (
                      <div className="w-8 flex-shrink-0" />
                    )}

                    {/* Message content */}
                    <div
                      className={`flex flex-col ${
                        isOwn ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Sender name (only for others and first message in group) */}
                      {!isOwn && isFirstMsg && (
                        <div className="flex gap-2 items-center mb-1 ml-3">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {getSenderDisplayName(msg.senderId)}
                          </p>
                          {getSenderData(msg.senderId)?.department && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5 font-medium">
                              {getSenderData(msg.senderId)?.department}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Message bubble container */}
                      <div className="relative flex items-center gap-1">
                        {/* Options menu for own messages */}
                        {isOwn && (
                          <MessageOptionsMenu
                            msg={msg}
                            users={users}
                            user={user}
                            openPopoverId={openPopoverId}
                            setOpenPopoverId={setOpenPopoverId}
                            setReplyTo={setReplyTo}
                            setEditMessage={setEditMessage}
                            handlePinMessage={handlePinMessage}
                            handleRemovePinMessage={handleRemovePinMessage}
                            handleBumpMessage={handleBumpMessage}
                            handleForwardMessage={handleForwardMessage}
                            copy={copy}
                            copyImageToClipboard={copyImageToClipboard}
                            downloadFile={downloadFile}
                            getSenderDisplayName={getSenderDisplayName}
                            chatId={chatId}
                            isCurrentUser={true}
                          />
                        )}

                        {/* Message bubble */}
                        <div
                          className={`relative shadow-sm ${
                            isOwn
                              ? "bg-blue-500 dark:bg-blue-600 text-white"
                              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-gray-600/50"
                          } ${
                            msg.type === "file"
                              ? "rounded-2xl overflow-hidden"
                              : "px-3 py-2 rounded-2xl max-w-md"
                          } ${
                            // Telegram-style bubble tails
                            isOwn && isLastMsg
                              ? "rounded-br-md"
                              : !isOwn && isLastMsg
                              ? "rounded-bl-md"
                              : ""
                          }`}
                        >
                          {/* Pin indicator */}
                          {msg.pinned && (
                            <div className="absolute z-10 -top-2 -right-2">
                              <div className="bg-red-500 rounded-full p-1">
                                <Icon
                                  icon="solar:pin-bold"
                                  width="10"
                                  height="10"
                                  className="text-white"
                                />
                              </div>
                            </div>
                          )}

                          {/* Reply message display */}
                          <ReplyMessageDisplay
                            message={msg}
                            getSenderDisplayName={getSenderDisplayName}
                            onReplyClick={handleReplyClick}
                          />

                          {/* Message content */}
                          {msg.type === "file" ? (
                            <FileMessage
                              message={msg}
                              handleImageLoad={handleImageLoad}
                              handleVideoLoad={handleVideoLoad}
                              loadingStates={loadingStates}
                              getSenderData={getSenderData}
                            />
                          ) : (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: formatMessageWithLinks(
                                  msg.message,
                                  msg.senderId,
                                  user?.uid
                                ),
                              }}
                              className="text-sm whitespace-pre-wrap break-words leading-relaxed"
                            />
                          )}

                          {/* Message footer for own messages - Only show on last message in group */}
                          {isOwn && isLastMsg && (
                            <div className="flex items-center justify-end gap-1 mt-1">
                              {/* Message status indicators */}
                              <div className="flex items-center gap-1">
                                {/* Forward/Edit/Bump indicators */}
                                {msg.forwarded && (
                                  <Icon
                                    icon="material-symbols:forward"
                                    width="12"
                                    height="12"
                                    className="opacity-60"
                                  />
                                )}
                                {msg.edited && (
                                  <span className="text-xs opacity-60">
                                    edited
                                  </span>
                                )}
                                {msg.bumpedFrom && (
                                  <span className="text-xs opacity-60">
                                    bumped
                                  </span>
                                )}

                                {/* Timestamp */}
                                <span className="text-xs opacity-60">
                                  {formatTimestamp(msg.timestamp)}
                                </span>

                                {/* Read status */}
                                {msg.status === "sending" ? (
                                  <Icon
                                    icon="ic:round-access-time"
                                    width="14"
                                    height="14"
                                    className="opacity-60"
                                  />
                                ) : msg.seenBy?.length > 0 ? (
                                  <Icon
                                    icon="material-symbols:done-all"
                                    width="16"
                                    height="16"
                                    className="text-blue-300"
                                  />
                                ) : (
                                  <Icon
                                    icon="material-symbols:done"
                                    width="14"
                                    height="14"
                                    className="opacity-60"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Options menu for other messages */}
                        {!isOwn && (
                          <MessageOptionsMenu
                            msg={msg}
                            users={users}
                            user={user}
                            openPopoverId={openPopoverId}
                            setOpenPopoverId={setOpenPopoverId}
                            setReplyTo={setReplyTo}
                            setEditMessage={setEditMessage}
                            handlePinMessage={handlePinMessage}
                            handleRemovePinMessage={handleRemovePinMessage}
                            handleBumpMessage={handleBumpMessage}
                            handleForwardMessage={handleForwardMessage}
                            copy={copy}
                            copyImageToClipboard={copyImageToClipboard}
                            downloadFile={downloadFile}
                            getSenderDisplayName={getSenderDisplayName}
                            chatId={chatId}
                            isCurrentUser={false}
                          />
                        )}
                      </div>

                      {/* Reactions and timestamp for other messages - Only show timestamp on last message in group */}
                      {!isOwn && (
                        <div className="flex flex-col gap-1 ml-3 mt-1">
                          {/* Reactions */}
                          {msg.reactions && (
                            <EmojiReactions
                              msg={msg}
                              getSenderData={getSenderData}
                              user={user}
                            />
                          )}

                          {/* Message footer - Only show on last message in group */}
                          {isLastMsg && (
                            <div className="flex items-center gap-1">
                              {msg.forwarded && (
                                <Icon
                                  icon="material-symbols:forward"
                                  width="12"
                                  height="12"
                                  className="text-gray-400 dark:text-gray-500"
                                />
                              )}
                              {msg.edited && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  edited
                                </span>
                              )}
                              {msg.bumpedFrom && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  bumped
                                </span>
                              )}
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatTimestamp(msg.timestamp)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Reactions for own messages */}
                      {isOwn && msg.reactions && (
                        <div className="mr-3 mt-1">
                          <EmojiReactions
                            msg={msg}
                            getSenderData={getSenderData}
                            user={user}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <ForwardMessageDialog
        messageId={selectedMessage?.id}
        messageContent={selectedMessage?.message}
        originalFileData={selectedMessage?.fileData}
        currentUserId={currentUserId}
        isOpen={forwardDialogOpen}
        onClose={() => {
          setForwardDialogOpen(false);
          setSelectedMessage(null);
        }}
      />
    </>
  );
};
