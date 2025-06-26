import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const ReplyDialog = ({
  getSenderDisplayName,
  msg,
  userId,
  messageId,
  chatId,
}) => {
  const [replyMessage, setReplyMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;

    setIsSending(true);
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");

      const replyData = {
        message: replyMessage.trim(),
        senderId: userId,
        timestamp: serverTimestamp(),
        replyTo: {
          messageId: messageId,
          senderId: msg.senderId,
          message: msg.message || null,
          senderName: getSenderDisplayName(msg.senderId),
          ...(msg.fileData && { fileData: msg.fileData }),
        },
        reactions: {},
      };

      await addDoc(messagesRef, replyData);

      // Reset form and close dialog
      setReplyMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="flex items-center gap-2 text-sm font-semibold p-1 w-full rounded-lg hover:bg-gray-500/10">
        <Icon icon="solar:reply-broken" width="24" height="24" /> Reply
      </DialogTrigger>

      <DialogContent className="w-96 max-w-md">
        <DialogHeader>
          <DialogTitle>
            Reply to{" "}
            <span className="text-blue-600">
              {getSenderDisplayName(msg.senderId)}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Original message preview */}
        <div className="text-sm border p-3 rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
          <div className="font-medium text-gray-600 mb-1">
            {getSenderDisplayName(msg.senderId)}
          </div>

          {/* Show file if exists */}
          {msg.fileData && (
            <div className="mb-2 p-2 bg-white rounded border flex items-center gap-2">
              {msg.fileData.type?.startsWith("image/") ? (
                <div className="flex items-center gap-2">
                  <Icon
                    icon="solar:gallery-bold"
                    className="text-blue-500"
                    width="16"
                    height="16"
                  />
                  <span className="text-xs text-gray-600">
                    Image: {msg.fileData.name}
                  </span>
                </div>
              ) : msg.fileData.type?.startsWith("video/") ? (
                <div className="flex items-center gap-2">
                  <Icon
                    icon="solar:videocamera-bold"
                    className="text-red-500"
                    width="16"
                    height="16"
                  />
                  <span className="text-xs text-gray-600">
                    Video: {msg.fileData.name}
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
                    File: {msg.fileData.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Show message text if exists */}
          {msg.message && (
            <div className="text-gray-800 line-clamp-3">{msg.message}</div>
          )}

          {/* Show placeholder if no message and no file */}
          {!msg.message && !msg.fileData && (
            <div className="text-gray-400 italic">No content</div>
          )}
        </div>

        {/* Reply input */}
        <div className="space-y-2">
          <Label htmlFor="replyMessage">Your Reply</Label>
          <Textarea
            id="replyMessage"
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Write your reply..."
            className="resize-none text-gray-800 border shadow whitespace-normal min-h-[80px]"
            rows={3}
            disabled={isSending}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setReplyMessage("");
              setIsOpen(false);
            }}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendReply}
            disabled={!replyMessage.trim() || isSending}
            className="flex items-center gap-2"
          >
            {isSending ? (
              <>
                <Icon
                  icon="eos-icons:loading"
                  className="animate-spin"
                  width="16"
                  height="16"
                />
                Sending...
              </>
            ) : (
              <>
                <Icon icon="solar:plain-2-broken" width="16" height="16" />
                Send Reply
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
