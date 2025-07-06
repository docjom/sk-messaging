import React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Icon } from "@iconify/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EmojiSet } from "./EmojiSet";

export function MessageOptionsMenu({
  msg,
  users,
  user,
  openPopoverId,
  setOpenPopoverId,
  setReplyTo,
  setEditMessage,
  handlePinMessage,
  handleRemovePinMessage,
  handleBumpMessage,
  handleForwardMessage,
  copy,
  copyImageToClipboard,
  downloadFile,
  getSenderDisplayName,
  chatId,
  isCurrentUser,
}) {
  return (
    <Popover
      open={openPopoverId === msg.id}
      onOpenChange={(open) => setOpenPopoverId(open ? msg.id : null)}
    >
      <PopoverTrigger asChild>
        <Button variant={"ghost"} size={"sm"} className="mr-2 rounded-full">
          <Icon icon="solar:menu-dots-bold-duotone" width="24" height="24" />
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
                  <Icon icon="solar:check-read-broken" width="24" height="24" />
                  <span>{msg.seenBy?.length} Seen</span>
                </div>
                <div className="flex -space-x-2">
                  {msg.seenBy.slice(0, 3).map((uid) => {
                    const userObj = users.find((u) => u.id === uid);
                    return (
                      <Avatar key={uid} className="w-6 h-6">
                        <AvatarImage
                          src={userObj?.photoURL}
                          alt={userObj?.displayName}
                        />
                        <AvatarFallback>
                          {userObj?.displayName?.[0]?.toUpperCase() || "P"}
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
                  const userObj = users.find((u) => u.id === uid);
                  return (
                    <div
                      key={uid}
                      className="flex items-center gap-2 hover:bg-gray-500/20 p-1 rounded-sm transition-colors cursor-pointer"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                          src={userObj?.photoURL}
                          alt={userObj?.displayName}
                        />
                        <AvatarFallback>
                          {userObj?.displayName?.[0]?.toUpperCase() || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {userObj?.displayName || "Unknown"}
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
          <Button
            onClick={() => handlePinMessage(msg.id)}
            variant={"ghost"}
            size={"sm"}
            className="flex w-full justify-start gap-2 items-center"
          >
            <Icon icon="solar:pin-broken" width="20" height="20" />
            Pin
          </Button>
        ) : (
          <Button
            onClick={() => handleRemovePinMessage(msg.id)}
            variant={"ghost"}
            size={"sm"}
            className="flex w-full justify-start gap-2 items-center"
          >
            <Icon icon="solar:pin-broken" width="20" height="20" />
            Unpin
          </Button>
        )}

        <Button
          onClick={() => handleBumpMessage(msg.id)}
          variant={"ghost"}
          size={"sm"}
          className="flex w-full justify-start gap-2 items-center"
        >
          <Icon icon="solar:shield-up-broken" width="20" height="20" />
          Bump
        </Button>
        <Button
          onClick={() => handleForwardMessage(msg.id)}
          variant={"ghost"}
          size={"sm"}
          className="flex w-full justify-start gap-2 items-center"
        >
          <Icon icon="solar:forward-broken" width="20" height="20" />
          Forward
        </Button>

        {msg.message && (
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

        {/* File/Media options */}
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
                  <Icon icon="solar:copy-broken" width="24" height="24" />
                  Copy image address
                </Button>
                <Button
                  onClick={() => {
                    downloadFile(
                      msg.fileData.url,
                      msg.fileData.name || "image"
                    );
                    setOpenPopoverId(null);
                  }}
                  variant={"ghost"}
                  size={"sm"}
                  className="flex w-full justify-start gap-2 items-center"
                >
                  <Icon icon="solar:copy-broken" width="24" height="24" />
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
                    downloadFile(msg.fileData.url, msg.fileData.name || "file");
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

        {isCurrentUser && msg.message && (
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
            <Icon icon="solar:gallery-edit-broken" width="24" height="24" />
            Edit
          </Button>
        )}

        <div className="absolute w-52 -top-13 left-0 mt-2">
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
  );
}
