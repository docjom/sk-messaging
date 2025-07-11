import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limitToLast,
  onSnapshot,
  endBefore,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

export const useInfiniteMessages = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestMessage, setOldestMessage] = useState(null);
  const unsubscribeRef = useRef(null);

  // Load initial messages (latest 50)
  useEffect(() => {
    if (chatId) {
      setMessagesLoading(true);
      setMessages([]);
      setHasMoreMessages(true);
      setOldestMessage(null);

      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(messagesRef, orderBy("timestamp"), limitToLast(50));

      unsubscribeRef.current = onSnapshot(q, (querySnapshot) => {
        const snapshotMessages = [];
        querySnapshot.forEach((doc) => {
          snapshotMessages.push({ id: doc.id, ...doc.data() });
        });

        const sortedSnapshot = snapshotMessages.sort(
          (a, b) => a.timestamp?.toMillis?.() - b.timestamp?.toMillis?.()
        );

        setMessages((prevMessages) => {
          const existingIds = new Set(prevMessages.map((msg) => msg.id));
          const newOnes = sortedSnapshot.filter(
            (msg) => !existingIds.has(msg.id)
          );
          return [...prevMessages, ...newOnes].sort(
            (a, b) => a.timestamp?.toMillis?.() - b.timestamp?.toMillis?.()
          );
        });

        setMessagesLoading(false);

        if (snapshotMessages.length > 0) {
          setOldestMessage(snapshotMessages[0]);
        }

        if (snapshotMessages.length < 50) {
          setHasMoreMessages(false);
        }
      });

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } else {
      setMessages([]);
      setMessagesLoading(false);
      setHasMoreMessages(true);
      setOldestMessage(null);
    }
  }, [chatId]);

  const loadOlderMessages = useCallback(async () => {
    if (!chatId || !oldestMessage || loadingOlder || !hasMoreMessages) {
      console.log("Early return:", {
        chatId,
        oldestMessage,
        loadingOlder,
        hasMoreMessages,
      });
      return;
    }

    console.log("🔼 Fetching older messages...");
    console.log(
      "Current oldest timestamp:",
      oldestMessage.timestamp?.toDate?.()
    );

    setLoadingOlder(true);

    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(
        messagesRef,
        orderBy("timestamp"),
        endBefore(oldestMessage.timestamp),
        limit(25)
      );

      const querySnapshot = await getDocs(q);

      const olderMessages = [];
      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        olderMessages.push(data);
      });

      console.log(`🧾 Retrieved ${olderMessages.length} older messages:`);
      olderMessages.forEach((msg, idx) => {
        console.log(`[${idx}]`, {
          id: msg.id,
          message: msg.message,
          timestamp: msg.timestamp?.toDate?.(),
          senderId: msg.senderId,
        });
      });

      // Prepend to existing messages
      setMessages((prevMessages) => [...olderMessages, ...prevMessages]);

      if (olderMessages.length > 0) {
        setOldestMessage(olderMessages[0]);
      }

      if (olderMessages.length < 25) {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("❌ Error loading older messages:", error);
    } finally {
      setLoadingOlder(false);
    }
  }, [chatId, oldestMessage, loadingOlder, hasMoreMessages]);

  return {
    messages,
    messagesLoading,
    loadingOlder,
    hasMoreMessages,
    loadOlderMessages,
  };
};
