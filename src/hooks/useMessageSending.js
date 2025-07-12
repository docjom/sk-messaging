import { toast } from "sonner";
import { db } from "../firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useMessageActionStore } from "../stores/useMessageActionStore";

export const useMessageSending = () => {
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

    setIsMessagesSending(true);

    try {
      let imageURL = null;
      if (pastedImage) {
        imageURL = await uploadImageToStorage(pastedImage.file, chatId);
      }

      if (edit?.messageId) {
        const msgRef = doc(db, "chats", chatId, "messages", edit.messageId);
        const updateData = {
          message: message,
          edited: true,
          timestamp: edit?.timestamp,
          editTimestamp: serverTimestamp(),
        };
        await updateDoc(msgRef, updateData);
        useMessageActionStore.getState().clearEdit();
      } else {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const chatRef = doc(db, "chats", chatId);

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

        if (message && message.match(/(https?:\/\/[^\s]+)/g)) {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const foundLinks = message.match(urlRegex);
          const filesRef = collection(db, "chats", chatId, "files");
          for (const url of foundLinks) {
            await addDoc(filesRef, {
              senderId,
              type: "link",
              url,
              timestamp: serverTimestamp(),
            });
          }
        }

        if (imageURL) {
          const filesRef = collection(db, "chats", chatId, "files");
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

        const msgRef = await addDoc(messagesRef, messagePayload);
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
