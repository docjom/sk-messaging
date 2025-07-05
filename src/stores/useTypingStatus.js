import { create } from "zustand";
import {
  subscribeToTypingStatus,
  startTypingWithTimeout,
  removeTypingStatus,
} from "../composables/typingService";

export const useTypingStatus = create((set, get) => ({
  typingUsers: {},
  subscriptions: {},
  userNames: {},

  setUserNames: (userNames) => {
    set({ userNames });
  },

  setTypingUsers: ({ chatId, userId, userName }) => {
    if (userId) {
      // Update user names
      set((state) => ({
        userNames: {
          ...state.userNames,
          [userId]: userName,
        },
      }));

      startTypingWithTimeout(chatId, userId, userName);
    }
  },

  subscribeToChat: (chatId) => {
    const { subscriptions } = get();

    if (subscriptions[chatId]) {
      return;
    }

    const unsubscribe = subscribeToTypingStatus(chatId, (typingUsers) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [chatId]: typingUsers,
        },
      }));
    });

    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        [chatId]: unsubscribe,
      },
    }));
  },

  unsubscribeFromChat: (chatId) => {
    const { subscriptions } = get();

    if (subscriptions[chatId]) {
      subscriptions[chatId]();

      set((state) => {
        const newSubscriptions = { ...state.subscriptions };
        delete newSubscriptions[chatId];

        const newTypingUsers = { ...state.typingUsers };
        delete newTypingUsers[chatId];

        return {
          subscriptions: newSubscriptions,
          typingUsers: newTypingUsers,
        };
      });
    }
  },

  stopTyping: (chatId, userId) => {
    removeTypingStatus(chatId, userId);
  },

  getTypingUsersForChat: (chatId) => {
    const { typingUsers, userNames } = get();
    const chatTypingUsers = typingUsers[chatId] || [];

    return chatTypingUsers.map((user) => ({
      ...user,
      userName: userNames[user.userId] || "Unknown User",
    }));
  },

  cleanup: () => {
    const { subscriptions } = get();

    Object.values(subscriptions).forEach((unsubscribe) => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    });

    set({
      subscriptions: {},
      typingUsers: {},
    });
  },
}));
