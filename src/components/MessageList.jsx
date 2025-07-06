import React, { useRef, useState, useCallback } from "react";
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
import { useUserStore } from "@/stores/useUserStore";
import { FileMessage } from "./FileMessage";
import { EmojiReactions } from "./EmojiReactions";
import { formatMessageWithLinks } from "../composables/scripts";
import { toast } from "sonner";
import {
  doc,
  serverTimestamp,
  getDoc,
  addDoc,
  writeBatch,
  collection,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatTimestamp } from "../composables/scripts";
import ForwardMessageDialog from "./ForwardMessageDialog";
export const MessageList = ({
  messages,
  getSenderData,
  getSenderDisplayName,
}) => {
  const messagesEndRef = useRef(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [openPopoverId, setOpenPopoverId] = useState(null);
  const { setEditMessage, setReplyTo, chatId, users } = useMessageActionStore();
  const userProfile = useUserStore((s) => s.userProfile);
  const user = userProfile;
  const currentUserId = user?.uid;

  // Add these state variables to your component
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Updated handleForwardMessage function
  const handleForwardMessage = (messageId) => {
    const message = messages.find((msg) => msg.id === messageId);
    setSelectedMessage(message);
    setForwardDialogOpen(true);
    setOpenPopoverId(null);
  };

  const handlePinMessage = async (messageId) => {
    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      await updateDoc(messageRef, {
        pinned: true,
        pinnedAt: serverTimestamp(),
      });

      const chatRef = doc(db, "chats", chatId);
      const userRef = doc(db, "users", currentUserId);
      const userSnap = await getDoc(userRef);
      const name = userSnap.data()?.displayName || "Someone";

      const batch = writeBatch(db);
      batch.update(chatRef, {
        lastMessage: `${name} pinned a message`,
        lastMessageTime: serverTimestamp(),
      });
      const msgRef = collection(db, "chats", chatId, "messages");
      batch.set(doc(msgRef), {
        senderId: currentUserId,
        message: `${name} pinned a message`,
        timestamp: serverTimestamp(),
        type: "system",
      });
      await batch.commit();

      setOpenPopoverId(null);
    } catch (error) {
      console.error("Failed to pin message:", error);
    }
  };

  const handleRemovePinMessage = async (messageId) => {
    try {
      const msgRef = doc(db, "chats", chatId, "messages", messageId);
      await updateDoc(msgRef, {
        pinned: false,
        pinnedAt: null,
      });
      setOpenPopoverId(null);
    } catch (error) {
      console.error("Error unpinning message:", error);
    }
  };

  const handleBumpMessage = async (messageId) => {
    try {
      // Get user's name
      const userRef = doc(db, "users", currentUserId);
      const userSnap = await getDoc(userRef);
      const name = userSnap.data()?.displayName || "Someone";

      // Get the original message
      const originalMsgRef = doc(db, "chats", chatId, "messages", messageId);
      const originalMsgSnap = await getDoc(originalMsgRef);
      const originalMsg = originalMsgSnap.data();

      if (!originalMsg) throw new Error("Message not found.");

      // Create a new bumped message with updated timestamp
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        ...originalMsg,
        bumpedFrom: messageId, // Optional trace
        timestamp: serverTimestamp(),
      });

      // Update the chat's last message to reflect bump
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        lastMessage: `${name} bumped a message`,
        lastMessageTime: serverTimestamp(),
      });

      setOpenPopoverId(null);
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

  // Copy image to clipboard
  const copyImageToClipboard = async (imageUrl) => {
    try {
      // Fetch the image as blob
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();

      console.log("Blob type:", blob.type);

      // Check if clipboard API supports writing images
      if (navigator.clipboard && window.ClipboardItem) {
        const clipboardItem = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([clipboardItem]);
        toast.success("Image copied to clipboard!");
      } else {
        // Fallback: copy image URL to clipboard
        await navigator.clipboard.writeText(imageUrl);
        toast.success("Image URL copied to clipboard!");
      }
    } catch (err) {
      console.error("Failed to copy image:", err);
      // Fallback: copy image URL
      try {
        await navigator.clipboard.writeText(imageUrl);
        toast.success("Image URL copied to clipboard!");
      } catch (e) {
        toast.error("Failed to copy image");
        console.log(e);
      }
    }
  };

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

  return (
    <>
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex mb-2 ${
              msg.type === "system"
                ? "justify-center"
                : msg.senderId === user?.uid
                ? "justify-end"
                : "justify-start"
            }`}
          >
            {/* Options button for current user messages */}
            {msg.senderId === user?.uid && msg.type !== "system" && (
              <div className="relative">
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
                      className="mr-2 rounded-full"
                    >
                      <Icon
                        icon="solar:menu-dots-bold-duotone"
                        width="24"
                        height="24"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-1">
                    {/* Seen Users Preview + Nested Popover */}
                    {msg.seenBy?.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 w-full justify-between"
                          >
                            <div className="flex gap-1 justify-start items-center">
                              <Icon
                                icon="solar:check-read-broken"
                                width="24"
                                height="24"
                              />
                              <span>{msg.seenBy?.length} Seen</span>
                            </div>
                            <div className="flex -space-x-2">
                              {msg.seenBy.slice(0, 3).map((uid) => {
                                const user = users.find((u) => u.id === uid);
                                return (
                                  <Avatar key={uid} className="w-6 h-6">
                                    <AvatarImage
                                      src={user?.photoURL}
                                      alt={user?.displayName}
                                    />
                                    <AvatarFallback>
                                      {" "}
                                      {user?.displayName[0]?.toUpperCase() ||
                                        "P"}
                                    </AvatarFallback>
                                  </Avatar>
                                );
                              })}
                              {msg.seenBy.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{msg.seenBy.length - 3}
                                </span>
                              )}
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {msg.seenBy.map((uid) => {
                              const user = users.find((u) => u.id === uid);
                              return (
                                <div
                                  key={uid}
                                  className="flex items-center gap-2 hover:bg-gray-500/20 p-1 rounded-sm transition-colors cursor-pointer"
                                >
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage
                                      src={user?.photoURL}
                                      alt={user?.displayName}
                                    />
                                    <AvatarFallback>
                                      {" "}
                                      {user?.displayName[0]?.toUpperCase() ||
                                        "P"}
                                    </AvatarFallback>
                                  </Avatar>

                                  <span className="text-sm">
                                    {user?.displayName || "Unknown"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

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
                    {!msg.pinned ? (
                      <>
                        {" "}
                        <Button
                          onClick={() => handlePinMessage(msg.id)}
                          variant={"ghost"}
                          size={"sm"}
                          className="flex w-full justify-start gap-2 items-center"
                        >
                          <Icon
                            icon="solar:pin-broken"
                            width="20"
                            height="20"
                          />
                          Pin
                        </Button>
                      </>
                    ) : (
                      <>
                        {" "}
                        <Button
                          onClick={() => handleRemovePinMessage(msg.id)}
                          variant={"ghost"}
                          size={"sm"}
                          className="flex w-full justify-start gap-2 items-center"
                        >
                          <Icon
                            icon="solar:pin-broken"
                            width="20"
                            height="20"
                          />
                          Unpin
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => handleBumpMessage(msg.id)}
                      variant={"ghost"}
                      size={"sm"}
                      className="flex w-full justify-start gap-2 items-center"
                    >
                      <Icon
                        icon="solar:shield-up-broken"
                        width="20"
                        height="20"
                      />
                      Bump
                    </Button>
                    <Button
                      onClick={() => handleForwardMessage(msg.id)}
                      variant={"ghost"}
                      size={"sm"}
                      className="flex w-full justify-start gap-2 items-center"
                    >
                      <Icon
                        icon="solar:forward-broken"
                        width="20"
                        height="20"
                      />
                      Forward
                    </Button>

                    {msg.message && msg.fileData && (
                      <Button
                        onClick={() => {
                          copy(msg.message);
                          setOpenPopoverId(null);
                        }}
                        variant={"ghost"}
                        size={"sm"}
                        className="flex w-full justify-start gap-2 items-center"
                      >
                        <Icon icon="solar:copy-broken" width="24" height="24" />
                        Copy text
                      </Button>
                    )}
                    {msg.message && !msg.fileData && (
                      <Button
                        onClick={() => {
                          copy(msg.message);
                          setOpenPopoverId(null);
                        }}
                        variant={"ghost"}
                        size={"sm"}
                        className="flex w-full justify-start gap-2 items-center"
                      >
                        <Icon icon="solar:copy-broken" width="24" height="24" />
                        Copy text
                      </Button>
                    )}

                    {/* File/Media options for current user */}
                    {msg.fileData && (
                      <>
                        {msg.fileData.type?.startsWith("image/") && (
                          <>
                            <Button
                              onClick={() => {
                                copyImageToClipboard(msg.fileData.url);
                                setOpenPopoverId(null);
                              }}
                              variant={"ghost"}
                              size={"sm"}
                              className="flex w-full justify-start gap-2 items-center"
                            >
                              <Icon
                                icon="solar:copy-broken"
                                width="24"
                                height="24"
                              />
                              Copy image address
                            </Button>
                            <Button
                              onClick={() => {
                                downloadFile(msg.fileData.url);
                                setOpenPopoverId(null);
                              }}
                              variant={"ghost"}
                              size={"sm"}
                              className="flex w-full justify-start gap-2 items-center"
                            >
                              <Icon
                                icon="solar:copy-broken"
                                width="24"
                                height="24"
                              />
                              Save image
                            </Button>
                          </>
                        )}

                        {msg.fileData.type?.startsWith("video/") && (
                          <Button
                            onClick={() => {
                              downloadFile(
                                msg.fileData.url,
                                msg.fileData.name || "video.mp4"
                              );
                              setOpenPopoverId(null);
                            }}
                            variant={"ghost"}
                            size={"sm"}
                            className="flex w-full justify-start gap-2 items-center"
                          >
                            <Icon
                              icon="solar:chat-round-video-broken"
                              width="24"
                              height="24"
                            />
                            Save video
                          </Button>
                        )}

                        {!msg.fileData.type?.startsWith("image/") &&
                          !msg.fileData.type?.startsWith("video/") && (
                            <Button
                              onClick={() => {
                                downloadFile(
                                  msg.fileData.url,
                                  msg.fileData.name || "file"
                                );
                                setOpenPopoverId(null);
                              }}
                              variant={"ghost"}
                              size={"sm"}
                              className="flex w-full justify-start gap-2 items-center"
                            >
                              <Icon
                                icon="solar:file-download-broken"
                                width="20"
                                height="20"
                              />
                              Download file
                            </Button>
                          )}
                      </>
                    )}

                    {msg.message && (
                      <Button
                        onClick={() => {
                          setEditMessage({
                            messageId: msg.id,
                            message: msg.message,
                            senderId: msg.senderId,
                            fileData: msg.fileData,
                            timestamp: msg.timestamp,
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
                    )}

                    <div className="absolute w-52 -top-13  left-0  mt-2">
                      <div className="relative">
                        <EmojiSet
                          messageId={msg.id}
                          userId={user?.uid}
                          chatId={chatId}
                          onSelect={() => setOpenPopoverId(null)}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* ------------------------------------------------ */}
            <div>
              {/* Header with sender info */}
              {msg.senderId !== user?.uid && msg.type !== "system" && (
                <div className="flex gap-1.5 text-xs ml-7 items-center mb-0.5">
                  {getSenderDisplayName(msg.senderId) && (
                    <p className="capitalize font-semibold text-blue-600 dark:text-white">
                      {getSenderDisplayName(msg.senderId)}
                    </p>
                  )}
                  {getSenderData(msg.senderId)?.department && (
                    <span className="text-[10px] bg-blue-100 dark:bg-gray-500 dark:text-white text-blue-700 rounded-full px-2 py-0.5 font-medium">
                      {getSenderData(msg.senderId)?.department}
                    </span>
                  )}
                  {getSenderData(msg.senderId)?.position && (
                    <span className="text-[10px] dark:bg-gray-100 text-gray-600 rounded-full border px-2 py-0.5 font-medium">
                      {getSenderData(msg.senderId)?.position}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-end gap-1.5">
                {msg.senderId !== user?.uid && msg.type !== "system" && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={getSenderData(msg.senderId)?.photoURL} />
                    <AvatarFallback></AvatarFallback>
                  </Avatar>
                )}

                <div>
                  <div
                    className={`relative max-w-52 h-auto ${
                      msg.type === "system"
                        ? "bg-white/80 dark:bg-transparent dark:border  text-center px-3 py-1.5 rounded-full shadow-sm text-xs"
                        : msg.senderId === user?.uid && msg.type !== "file"
                        ? `bg-blue-500 text-white px-3 py-2 shadow-sm ${"rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-lg"}`
                        : msg.type === "file" && msg.senderId === user?.uid
                        ? `bg-blue-500 text-white shadow-sm ${"rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-lg"}`
                        : msg.type === "file" && msg.senderId !== user?.uid
                        ? ` shadow-sm ${"rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-lg"}`
                        : ` px-3 py-2 shadow-sm border border-gray-100/10 ${"rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"}`
                    }`}
                  >
                    {msg.pinned && (
                      <div className="absolute -top-1 right-0 text-red-500">
                        <Icon icon="solar:pin-bold" width="14" height="14" />
                      </div>
                    )}

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
                                  user?.uid
                                ),
                              }}
                              className="text-sm max-w-52 whitespace-pre-wrap break-words "
                            />

                            <div
                              className={`flex items-center gap-1 ${
                                msg.senderId === user?.uid
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              {/* emoji reactions to message */}
                              {msg.reactions && (
                                <EmojiReactions
                                  msg={msg}
                                  getSenderData={getSenderData}
                                  user={user}
                                />
                              )}

                              <div
                                className={`text-[10px] flex ${
                                  msg.senderId === user?.uid
                                    ? "text-white/70"
                                    : "text-gray-400"
                                }`}
                              >
                                {msg.type === "forwarded" && (
                                  <span className="px-1">Forwarded</span>
                                )}
                                {msg.edited && (
                                  <span className="px-1">Edited</span>
                                )}
                                {msg.bumpedFrom && (
                                  <span className="px-1">Bump</span>
                                )}
                                {formatTimestamp(msg.timestamp)}
                              </div>
                              {msg.senderId === user?.uid && (
                                <div className="flex">
                                  {msg.senderId === user?.uid && (
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
                                      ) : msg.seenBy?.length > 0 ? (
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
                {msg.senderId !== user?.uid && msg.type !== "system" && (
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
                          className="mr-2 rounded-full"
                        >
                          <Icon
                            icon="solar:menu-dots-bold-duotone"
                            width="24"
                            height="24"
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-1">
                        {/* Seen Users Preview + Nested Popover */}
                        {msg.seenBy?.length > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 w-full justify-between"
                              >
                                <div className="flex gap-1 justify-start items-center">
                                  <Icon
                                    icon="solar:check-read-broken"
                                    width="24"
                                    height="24"
                                  />
                                  <span>{msg.seenBy?.length} Seen</span>
                                </div>
                                <div className="flex -space-x-2">
                                  {msg.seenBy.slice(0, 3).map((uid) => {
                                    const user = users.find(
                                      (u) => u.id === uid
                                    );
                                    return (
                                      <Avatar key={uid} className="w-6 h-6">
                                        <AvatarImage
                                          src={user?.photoURL}
                                          alt={user?.displayName}
                                        />
                                        <AvatarFallback>
                                          {" "}
                                          {user?.displayName[0]?.toUpperCase() ||
                                            "P"}
                                        </AvatarFallback>
                                      </Avatar>
                                    );
                                  })}
                                  {msg.seenBy.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{msg.seenBy.length - 3}
                                    </span>
                                  )}
                                </div>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2">
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {msg.seenBy.map((uid) => {
                                  const user = users.find((u) => u.id === uid);
                                  return (
                                    <div
                                      key={uid}
                                      className="flex items-center gap-2 hover:bg-gray-500/20 p-1 rounded-sm transition-colors cursor-pointer"
                                    >
                                      <Avatar className="w-6 h-6">
                                        <AvatarImage
                                          src={user?.photoURL}
                                          alt={user?.displayName}
                                        />
                                        <AvatarFallback>
                                          {" "}
                                          {user?.displayName[0]?.toUpperCase() ||
                                            "P"}
                                        </AvatarFallback>
                                      </Avatar>

                                      <span className="text-sm">
                                        {user?.displayName || "Unknown"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
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

                        {!msg.pinned ? (
                          <>
                            {" "}
                            <Button
                              onClick={() => handlePinMessage(msg.id)}
                              variant={"ghost"}
                              size={"sm"}
                              className="flex w-full justify-start gap-2 items-center"
                            >
                              <Icon
                                icon="solar:pin-broken"
                                width="20"
                                height="20"
                              />
                              Pin
                            </Button>
                          </>
                        ) : (
                          <>
                            {" "}
                            <Button
                              onClick={() => handleRemovePinMessage(msg.id)}
                              variant={"ghost"}
                              size={"sm"}
                              className="flex w-full justify-start gap-2 items-center"
                            >
                              <Icon
                                icon="solar:pin-broken"
                                width="20"
                                height="20"
                              />
                              Unpin
                            </Button>
                          </>
                        )}
                        <Button
                          onClick={() => handleBumpMessage(msg.id)}
                          variant={"ghost"}
                          size={"sm"}
                          className="flex w-full justify-start gap-2 items-center"
                        >
                          <Icon
                            icon="solar:shield-up-broken"
                            width="20"
                            height="20"
                          />
                          Bump
                        </Button>
                        <Button
                          onClick={() => handleForwardMessage(msg.id)}
                          variant={"ghost"}
                          size={"sm"}
                          className="flex w-full justify-start gap-2 items-center"
                        >
                          <Icon
                            icon="solar:forward-broken"
                            width="20"
                            height="20"
                          />
                          Forward
                        </Button>

                        {msg.message && msg.fileData && (
                          <Button
                            onClick={() => {
                              copy(msg.message);
                              setOpenPopoverId(null);
                            }}
                            variant={"ghost"}
                            size={"sm"}
                            className="flex w-full justify-start gap-2 items-center"
                          >
                            <Icon
                              icon="solar:copy-broken"
                              width="24"
                              height="24"
                            />
                            Copy text
                          </Button>
                        )}
                        {msg.message && !msg.fileData && (
                          <Button
                            onClick={() => {
                              copy(msg.message);
                              setOpenPopoverId(null);
                            }}
                            variant={"ghost"}
                            size={"sm"}
                            className="flex w-full justify-start gap-2 items-center"
                          >
                            <Icon
                              icon="solar:copy-broken"
                              width="24"
                              height="24"
                            />
                            Copy text
                          </Button>
                        )}

                        {/* File / Media Download Options */}
                        {msg.fileData && (
                          <>
                            {msg.fileData.type?.startsWith("image/") && (
                              <>
                                <Button
                                  onClick={() => {
                                    copyImageToClipboard(msg.fileData.url);
                                    setOpenPopoverId(null);
                                  }}
                                  variant={"ghost"}
                                  size={"sm"}
                                  className="flex w-full justify-start gap-2 items-center"
                                >
                                  <Icon
                                    icon="solar:copy-broken"
                                    width="24"
                                    height="24"
                                  />
                                  Copy image address
                                </Button>
                              </>
                            )}

                            {msg.fileData.type?.startsWith("video/") && (
                              <Button
                                onClick={() => {
                                  downloadFile(
                                    msg.fileData.url,
                                    msg.fileData.name || "video.mp4"
                                  );
                                  setOpenPopoverId(null);
                                }}
                                variant={"ghost"}
                                size={"sm"}
                                className="flex w-full justify-start gap-2 items-center"
                              >
                                <Icon
                                  icon="solar:chat-round-video-broken"
                                  width="24"
                                  height="24"
                                />
                                Save video
                              </Button>
                            )}

                            {!msg.fileData.type?.startsWith("image/") &&
                              !msg.fileData.type?.startsWith("video/") && (
                                <Button
                                  onClick={() => {
                                    downloadFile(
                                      msg.fileData.url,
                                      msg.fileData.name || "file"
                                    );
                                    setOpenPopoverId(null);
                                  }}
                                  variant={"ghost"}
                                  size={"sm"}
                                  className="flex w-full justify-start gap-2 items-center"
                                >
                                  <Icon
                                    icon="solar:file-download-broken"
                                    width="20"
                                    height="20"
                                  />
                                  Download File
                                </Button>
                              )}
                          </>
                        )}

                        <div className="absolute w-52 -top-13 left-0 mb-2">
                          <div className="relative">
                            <EmojiSet
                              messageId={msg.id}
                              userId={user?.uid}
                              chatId={chatId}
                              onSelect={() => setOpenPopoverId(null)}
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
