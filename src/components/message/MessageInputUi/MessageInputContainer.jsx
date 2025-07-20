import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { db } from "@/firebase";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { MessageInput } from "@/components/message/MessageInputUi/MessageInput";
import { useMessageSending } from "@/hooks/useMessageSending";
import { doc, getDoc } from "firebase/firestore";

const MessageInputContainer = ({
  chatId,
  user,
  messagesLoading,
  isMessagesSending,
  setIsMessagesSending,
  setIsFileDialogOpen,
  getSenderDisplayName,
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  const { replyTo, clearReply, editMessage, clearEdit } =
    useMessageActionStore();

  const { sendMessage } = useMessageSending();

  useEffect(() => {
    if ((replyTo || editMessage) && textareaRef.current) {
      if (editMessage) {
        setMessage(editMessage.message);
      }
      textareaRef.current.focus();
    }
  }, [replyTo, editMessage]);

  useEffect(() => {
    if (textareaRef.current && message.trim() === "") {
      textareaRef.current.focus();
    }
  }, [message]);

  const handleSendMessage = async () => {
    if (!chatId) {
      console.error("Chat ID is not set.");
      return;
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current?.focus();
    }

    const pastedImage = useMessageActionStore.getState().pastedImage;
    const msgToSend = message.trim();
    const reply = useMessageActionStore.getState().replyTo;
    const edit = useMessageActionStore.getState().editMessage;

    if (msgToSend === "" && !pastedImage) return;

    // Validate user permissions
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const chatUsers = chatData.users || [];
      if (!chatUsers.includes(user?.uid)) {
        toast.error("You can't message in this group.");
        return;
      }
    }

    clearReply();
    clearEdit();
    setMessage("");

    if (pastedImage) {
      useMessageActionStore.getState().clearPastedImage();
    }

    await sendMessage({
      chatId,
      senderId: user?.uid,
      message: msgToSend,
      reply,
      edit,
      pastedImage,
      setIsMessagesSending,
    });

    textareaRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    textareaRef.current?.focus();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCancelEdit = () => {
    clearEdit();
    clearReply();
    setMessage("");
    textareaRef.current?.focus();
  };

  return (
    <MessageInput
      chatId={chatId}
      messagesLoading={messagesLoading}
      isMessagesSending={isMessagesSending}
      setIsFileDialogOpen={setIsFileDialogOpen}
      handleKeyPress={handleKeyPress}
      handleSendMessage={handleSendMessage}
      handleCancelEdit={handleCancelEdit}
      message={message}
      textareaRef={textareaRef}
      replyTo={replyTo}
      editMessage={editMessage}
      setMessage={setMessage}
      getName={getSenderDisplayName}
    />
  );
};

export default MessageInputContainer;
