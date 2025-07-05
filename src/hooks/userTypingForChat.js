import { useEffect } from "react";
import { useTypingStatus } from "../stores/useTypingStatus";

export const useTypingForChat = (chatId) => {
  const subscribeToChat = useTypingStatus((state) => state.subscribeToChat);
  const unsubscribeFromChat = useTypingStatus(
    (state) => state.unsubscribeFromChat
  );
  const getTypingUsersForChat = useTypingStatus(
    (state) => state.getTypingUsersForChat
  );
  const setTypingUsers = useTypingStatus((state) => state.setTypingUsers);
  const setUserNames = useTypingStatus((state) => state.setUserNames);

  useEffect(() => {
    if (chatId) {
      subscribeToChat(chatId);
    }

    return () => {
      if (chatId) {
        unsubscribeFromChat(chatId);
      }
    };
  }, [chatId, subscribeToChat, unsubscribeFromChat]);

  return {
    typingUsers: getTypingUsersForChat(chatId),
    setTyping: (userId, userName) =>
      setTypingUsers({ chatId, userId, userName }),
    setUserNames: setUserNames,
  };
};
