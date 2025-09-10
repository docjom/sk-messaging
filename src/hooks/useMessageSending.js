import { toast } from "sonner";
import { uploadBytes, getDownloadURL } from "firebase/storage";
import {
  addDoc,
  serverTimestamp,
  updateDoc,
  setDoc,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useMessageActionStore } from "../stores/useMessageActionStore";

import { getRefs } from "@/utils/firestoreRefs";
import { useUserStore } from "@/stores/useUserStore";

export const useMessageSending = () => {
  const users = useMessageActionStore.getState().users;
  const userProfile = useUserStore.getState().userProfile;
  const clearMessage = useMessageActionStore.getState().clearMessage;

  const uploadImageToStorage = async (imageFile, chatId, topicId) => {
    const { storageRef } = getRefs({
      chatId,
      topicId,
      fileName: imageFile?.name,
    });

    const snapshot = await uploadBytes(storageRef, imageFile);
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
    if (!message && !pastedImage) return;

    const topicId = useMessageActionStore.getState().topicId;

    setIsMessagesSending(true);

    try {
      let imageURL = null;
      if (pastedImage) {
        imageURL = await uploadImageToStorage(
          pastedImage.file,
          chatId,
          topicId
        );
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
          senderName: userProfile?.displayName,
          senderProfilePic: userProfile?.photoURL || null,
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
              senderName: userProfile?.displayName,
              senderProfilePic: userProfile?.photoURL || null,
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
            senderName: userProfile?.displayName,
            senderProfilePic: userProfile?.photoURL || null,
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

        const lastMessageText = message
          ? message
          : imageURL
          ? `📎 ${pastedImage.name}`
          : "";

        await updateDoc(chatRef, {
          seenBy: [],
          lastMessage: lastMessageText,
          lastMessageTime: serverTimestamp(),
          lastSenderName: getSenderDisplayName(senderId),
          senderName: userProfile?.displayName,
          senderProfilePic: userProfile?.photoURL || null,
        });

        let topicName = null;
        let chatName = null;

        if (chatId) {
          const getChatRef = doc(db, "chats", chatId);
          const chatSnap = await getDoc(getChatRef);
          chatName = chatSnap.exists() ? chatSnap.data()?.name : null;
        }

        if (topicId) {
          const { chatRef } = getRefs({
            chatId,
            topicId,
          });

          const topicSnap = await getDoc(chatRef);
          topicName = topicSnap.exists() ? topicSnap.data()?.name : null;
        }

        const messageData = {
          ...messagePayload,
          chatName: chatName,
          topicName: topicName,
          status: "sent",
        };

        const userMessageRef = doc(
          db,
          "userMessages",
          senderId,
          "messages",
          msgRef.id
        );

        await setDoc(userMessageRef, messageData);
        useMessageActionStore.getState().clearReply();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error sending message ");
    } finally {
      setIsMessagesSending(false);
      clearMessage();
    }
  };

  return { sendMessage };
};
