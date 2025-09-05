import { db } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { getStorage, ref } from "firebase/storage";

export const getRefs = ({
  chatId,
  topicId = null,
  messageId = null,
  fileName = null,
}) => {
  const storage = getStorage();
  const timestamp = Date.now();
  const basePath = topicId
    ? ["chats", chatId, "topics", topicId]
    : ["chats", chatId];

  const storageBasePath = topicId
    ? [`chat-files/${chatId}/topics/${topicId}/${timestamp}/`]
    : [`chat-files/${chatId}-${timestamp}/`];

  const messageRef = messageId
    ? doc(db, ...basePath, "messages", messageId)
    : null;

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

export const getUserRef = (uid) => doc(db, "users", uid);
