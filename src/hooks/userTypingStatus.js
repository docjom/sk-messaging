// hooks
import { useEffect, useRef, useCallback } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useUserStore } from "@/stores/useUserStore";
import { useTypingStatus } from "@/stores/useTypingStatus";

export const useTypingStatusHook = (chatId) => {
  const { user } = useUserStore();
  const { setTypingUsers } = useTypingStatus();
  const timeoutRef = useRef(null);
  const lastTypedRef = useRef(0); // for throttling

  // ✅ Improved setTyping function with throttle + timeout
  const setTyping = useCallback(() => {
    if (!chatId || !user?.uid) return;

    const now = Date.now();
    if (now - lastTypedRef.current < 1000) return; // throttle: 1s

    lastTypedRef.current = now;

    const chatRef = doc(db, "chats", chatId);

    updateDoc(chatRef, {
      [`typingStatus.${user.uid}`]: true,
    }).catch(console.error);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      updateDoc(chatRef, {
        [`typingStatus.${user.uid}`]: false,
      }).catch(console.error);
    }, 3000);
  }, [chatId, user?.uid]);

  // 👂 Listen to typing status updates from Firestore
  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(db, "chats", chatId);
    const unsub = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTypingUsers(data.typingStatus || {});
      }
    });

    return () => {
      unsub();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [chatId, setTypingUsers]);

  // 🚫 Clear own typing status on unmount
  useEffect(() => {
    return () => {
      if (chatId && user?.uid) {
        const chatRef = doc(db, "chats", chatId);
        updateDoc(chatRef, {
          [`typingStatus.${user.uid}`]: false,
        }).catch(console.error);
      }
    };
  }, [chatId, user?.uid]);

  return { setTyping };
};
