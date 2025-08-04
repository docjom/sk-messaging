import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  query,
  orderBy,
  limitToLast,
  onSnapshot,
  endBefore,
  limit,
  getDocs,
} from "firebase/firestore";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { getRefs } from "@/utils/firestoreRefs";

export const useInfiniteMessages = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const oldestMessageRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const messageListenersRef = useRef(new Map());
  const initialLoadRef = useRef(true);
  const { topicId } = useMessageActionStore();

  const isMounted = useRef(true);
  const latestListenerId = useRef(null);

  // Memoize combined messages to avoid unnecessary re-renders
  const allMessages = useMemo(() => {
    const combined = [...messages, ...optimisticMessages];
    return combined.sort(
      (a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
    );
  }, [messages, optimisticMessages]);

  // Optimistic message addition
  const addOptimisticMessage = useCallback((message) => {
    const optimisticMsg = {
      ...message,
      id: `optimistic-${Date.now()}`,
      isOptimistic: true,
      timestamp: new Date(),
    };
    setOptimisticMessages((prev) => [...prev, optimisticMsg]);
    return optimisticMsg.id;
  }, []);

  // Remove optimistic message when real one arrives
  const removeOptimisticMessage = useCallback((optimisticId) => {
    setOptimisticMessages((prev) =>
      prev.filter((msg) => msg.id !== optimisticId)
    );
  }, []);

  // Clean up individual message listeners
  const cleanupMessageListeners = useCallback(() => {
    messageListenersRef.current.forEach((unsubscribe) => unsubscribe());
    messageListenersRef.current.clear();
  }, []);

  useEffect(() => {
    isMounted.current = true;

    // Clear state
    setMessages([]);
    setOptimisticMessages([]);
    setMessagesLoading(true);
    setHasMoreMessages(true);
    oldestMessageRef.current = null;
    initialLoadRef.current = true;
    cleanupMessageListeners();

    if (!chatId) {
      setMessagesLoading(false);
      return;
    }

    const currentListenerId = Date.now();
    const { messageCollectionRef } = getRefs({ chatId, topicId });

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const q = query(
      messageCollectionRef,
      orderBy("timestamp"),
      limitToLast(20) // Increased initial load for better UX
    );

    unsubscribeRef.current = onSnapshot(q, (querySnapshot) => {
      if (!isMounted.current || currentListenerId !== latestListenerId.current)
        return;

      const newMessages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || null,
      }));

      const sortedMessages = newMessages.sort(
        (a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
      );

      if (sortedMessages.length > 0) {
        oldestMessageRef.current = sortedMessages[0];
      }

      setMessages(sortedMessages);
      setMessagesLoading(false);
      initialLoadRef.current = false;

      // Remove any optimistic messages that now have real counterparts
      setOptimisticMessages((prev) =>
        prev.filter(
          (optimistic) =>
            !sortedMessages.some(
              (real) =>
                real.content === optimistic.content &&
                Math.abs(
                  (real.timestamp?.getTime() || 0) -
                    (optimistic.timestamp?.getTime() || 0)
                ) < 5000
            )
        )
      );
    });

    latestListenerId.current = currentListenerId;

    return () => {
      isMounted.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      cleanupMessageListeners();
    };
  }, [chatId, topicId, cleanupMessageListeners]);

  const loadOlderMessages = useCallback(async () => {
    if (
      !chatId ||
      !oldestMessageRef.current ||
      loadingOlder ||
      !hasMoreMessages
    ) {
      return;
    }

    setLoadingOlder(true);

    try {
      const { messageCollectionRef } = getRefs({ chatId, topicId });
      const q = query(
        messageCollectionRef,
        orderBy("timestamp"),
        endBefore(oldestMessageRef.current.timestamp),
        limit(20) // Load more messages at once
      );

      const querySnapshot = await getDocs(q);
      const olderMessages = [];

      querySnapshot.forEach((doc) => {
        const messageId = doc.id;
        const data = {
          id: messageId,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || null,
        };
        olderMessages.push(data);

        // Only set up listeners for messages that don't already have them
        if (!messageListenersRef.current.has(messageId)) {
          const { messageRef } = getRefs({ chatId, topicId, messageId });
          const unsubscribe = onSnapshot(messageRef, (docSnap) => {
            if (docSnap.exists()) {
              const updatedMsg = {
                id: docSnap.id,
                ...docSnap.data(),
                timestamp: docSnap.data().timestamp?.toDate() || null,
              };
              setMessages((prev) =>
                prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
              );
            }
          });
          messageListenersRef.current.set(messageId, unsubscribe);
        }
      });

      if (olderMessages.length > 0) {
        const sortedMessages = olderMessages.sort(
          (a, b) =>
            (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
        );
        oldestMessageRef.current = sortedMessages[0];
        setMessages((prev) => [...sortedMessages, ...prev]);
      }

      setHasMoreMessages(olderMessages.length === 20);
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setLoadingOlder(false);
    }
  }, [chatId, loadingOlder, hasMoreMessages, topicId]);

  return {
    messages: allMessages,
    messagesLoading,
    loadingOlder,
    hasMoreMessages,
    loadOlderMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
  };
};
