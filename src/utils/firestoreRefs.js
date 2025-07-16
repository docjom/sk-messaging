import { db } from "@/firebase";
import { doc, collection } from "firebase/firestore";

/**
 * Get Firestore references for messages, pinned messages, and chat based on chatId and optional topicId/messageId
 */
export const getRefs = ({ chatId, topicId = null, messageId = null }) => {
  const basePath = topicId
    ? ["chats", chatId, "topics", topicId]
    : ["chats", chatId];

  const messageRef = messageId
    ? doc(db, ...basePath, "messages", messageId)
    : null;

  const messageCollectionRef = collection(db, ...basePath, "messages");
  const pinnedMessagesRef = collection(db, ...basePath, "pinned-messages");
  const filesRef = collection(db, ...basePath, "files");

  const pinnedMessageDoc = (docId) =>
    doc(db, ...basePath, "pinned-messages", docId);

  const chatRef = doc(db, ...basePath);

  return {
    messageRef,
    messageCollectionRef,
    pinnedMessagesRef,
    pinnedMessageDoc,
    chatRef,
    filesRef,
  };
};

/**
 * Get Firestore reference for user doc
 */
export const getUserRef = (uid) => doc(db, "users", uid);
