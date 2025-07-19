import { db } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { getStorage, ref } from "firebase/storage";

/**
 * Get Firestore references for messages, pinned messages, and chat based on chatId and optional topicId/messageId
 */
export const getRefs = ({
  chatId,
  topicId = null,
  messageId = null,
  fileName = null,
}) => {
  const basePath = topicId
    ? ["chats", chatId, "topics", topicId]
    : ["chats", chatId];

  const storageBasePath = topicId
    ? ["chat-files", chatId, "topics", topicId]
    : ["chat-files", chatId];

  const messageRef = messageId
    ? doc(db, ...basePath, "messages", messageId)
    : null;

  const storage = getStorage();

  const messageCollectionRef = collection(db, ...basePath, "messages");
  const pinnedMessagesRef = collection(db, ...basePath, "pinned-messages");
  const filesRef = collection(db, ...basePath, "files");
  const storageRef = ref(storage, ...storageBasePath, fileName);

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
    storageRef,
  };
};

/**
 * Get Firestore reference for user doc
 */
export const getUserRef = (uid) => doc(db, "users", uid);
