import {
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// Set user as typing
export const setTypingStatus = async (chatId, userId) => {
  try {
    const typingRef = doc(db, "chats", chatId, "typing", "typingDocument");

    // Get the current document
    const typingDoc = await getDoc(typingRef);

    if (typingDoc.exists()) {
      // Update existing document
      await updateDoc(typingRef, {
        [`typingStatus.${userId}`]: true,
        users: arrayUnion(userId),
        timestamp: serverTimestamp(),
      });
    } else {
      // Create new document
      await setDoc(typingRef, {
        typingStatus: {
          [userId]: true,
        },
        users: [userId],
        timestamp: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error setting typing status:", error);
  }
};

// Remove typing status
export const removeTypingStatus = async (chatId, userId) => {
  try {
    const typingRef = doc(db, "chats", chatId, "typing", "typingDocument");

    const typingDoc = await getDoc(typingRef);

    if (typingDoc.exists()) {
      await updateDoc(typingRef, {
        [`typingStatus.${userId}`]: false,
        users: arrayRemove(userId),
        timestamp: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error removing typing status:", error);
  }
};

// Listen to typing status changes
export const subscribeToTypingStatus = (chatId, callback) => {
  const typingRef = doc(db, "chats", chatId, "typing", "typingDocument");

  return onSnapshot(typingRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const typingUsers = [];

      if (data.typingStatus) {
        Object.entries(data.typingStatus).forEach(([userId, isTyping]) => {
          if (isTyping) {
            typingUsers.push({
              userId,
              isTyping: true,
              timestamp: data.timestamp,
            });
          }
        });
      }

      callback(typingUsers);
    } else {
      callback([]);
    }
  });
};

// Auto-cleanup typing status after timeout
export const startTypingWithTimeout = (
  chatId,
  userId,
  userName,
  timeout = 3000
) => {
  setTypingStatus(chatId, userId, userName);

  // Clear any existing timeout
  if (window.typingTimeouts && window.typingTimeouts[`${chatId}_${userId}`]) {
    clearTimeout(window.typingTimeouts[`${chatId}_${userId}`]);
  }

  // Initialize timeouts object if it doesn't exist
  if (!window.typingTimeouts) {
    window.typingTimeouts = {};
  }

  // Set new timeout
  window.typingTimeouts[`${chatId}_${userId}`] = setTimeout(() => {
    removeTypingStatus(chatId, userId);
    delete window.typingTimeouts[`${chatId}_${userId}`];
  }, timeout);
};
