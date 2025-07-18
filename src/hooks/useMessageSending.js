import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useMessageActionStore } from "../stores/useMessageActionStore";

import { getRefs } from "@/utils/firestoreRefs";

export const useMessageSending = () => {
  const users = useMessageActionStore.getState().users;

  const uploadImageToStorage = async (imageFile, chatId) => {
    const storage = getStorage();
    const timestamp = Date.now();
    const imageRef = ref(
      storage,
      `chat-files/${chatId}/${timestamp}_${imageFile?.name}`
    );
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const getSenderDisplayName = (senderId) => {
    const sender = users.find((u) => u.id === senderId);
    return sender?.displayName || "Unknown User";
  };

  const sendMessage = async ({
    chatId,
    senderId,
    message,
    reply,
    edit,
    pastedImage,
    setIsMessagesSending,
  }) => {
    if (!message.trim() && !pastedImage) return;

    const topicId = useMessageActionStore.getState().topicId;

    setIsMessagesSending(true);

    try {
      let imageURL = null;
      if (pastedImage) {
        imageURL = await uploadImageToStorage(pastedImage.file, chatId);
      }

      const { chatRef, filesRef, messageCollectionRef } = getRefs({
        chatId,
        topicId,
      });

      if (edit?.messageId) {
        const messageId = edit?.messageId;
        const { messageRef } = getRefs({
          chatId,
          topicId,
          messageId,
        });

        const updateData = {
          message,
          edited: true,
          timestamp: edit?.timestamp,
          editTimestamp: serverTimestamp(),
        };

        await updateDoc(messageRef, updateData);
        await updateDoc(chatRef, {
          seenBy: [],
          lastMessage: message,
          lastMessageTime: serverTimestamp(),
          lastSenderName: getSenderDisplayName(senderId),
        });

        useMessageActionStore.getState().clearEdit();
      } else {
        const messagePayload = {
          senderId,
          message,
          seenBy: [],
          timestamp: serverTimestamp(),
          status: "sending",
          ...(reply?.messageId && {
            replyTo: {
              messageId: reply.messageId,
              senderId: reply.senderId || null,
              message: reply.message || null,
              senderName: reply.name || null,
              ...(reply.fileData && { fileData: reply.fileData }),
            },
          }),
          ...(imageURL && {
            type: "file",
            fileData: {
              fileName: pastedImage?.name,
              url: imageURL,
              name: pastedImage?.name,
              type: pastedImage?.type,
              size: pastedImage?.file.size,
            },
          }),
        };

        // Store any URLs as link files
        if (message && message.match(/(https?:\/\/[^\s]+)/g)) {
          const foundLinks = message.match(/(https?:\/\/[^\s]+)/g);
          for (const url of foundLinks) {
            await addDoc(filesRef, {
              senderId,
              type: "link",
              url,
              timestamp: serverTimestamp(),
            });
          }
        }

        // Store uploaded image as a file record too
        if (imageURL) {
          await addDoc(filesRef, {
            senderId,
            fileData: {
              fileName: pastedImage?.name,
              url: imageURL,
              name: pastedImage?.name,
              type: pastedImage?.type,
              size: pastedImage?.file.size,
            },
            timestamp: serverTimestamp(),
          });
        }

        const msgRef = await addDoc(messageCollectionRef, messagePayload);
        await updateDoc(msgRef, { status: "sent" });

        const lastMessageText = message.trim()
          ? message.trim()
          : imageURL
          ? `📎 ${pastedImage.name}`
          : "";

        await updateDoc(chatRef, {
          seenBy: [],
          lastMessage: lastMessageText,
          lastMessageTime: serverTimestamp(),
          lastSenderName: getSenderDisplayName(senderId),
        });

        useMessageActionStore.getState().clearReply();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error sending message ");
    } finally {
      setIsMessagesSending(false);
    }
  };

  return { sendMessage };
};
