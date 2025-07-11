// stores/useMessageActionStore.js
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export const useMessageActionStore = create(
  subscribeWithSelector((set, get) => ({
    replyTo: null,
    editMessage: null,
    pastedImage: null,
    chatId: null,
    chats: [],
    users: [],
    selectedUser: null,
    currentChat: null,
    

    setUsers: (data) => set({ users: data }),

    setSelectedUser: (data) => set({ selectedUser: data }),
    clearSelectedUser: () => set({ selectedUser: null }),

    setCurrentChat: (data) => set({ currentChat: data }),
    clearCurrentChat: () => set({ currentChat: null }),

    setChatIdTo: (data) => set({ chatId: data }),
    clearChat: () => set({ chatId: null }),

    setChats: (data) => set({ chats: data }),

    setReplyTo: (data) => set({ replyTo: data, editMessage: null }),
    clearReply: () => set({ replyTo: null }),

    setEditMessage: (data) => set({ editMessage: data, replyTo: null }),
    clearEdit: () => set({ editMessage: null }),

    setPastedImage: (imageData) => set({ pastedImage: imageData }),
    clearPastedImage: () => set({ pastedImage: null }),

    hasPastedImage: () => {
      const { pastedImage } = get();
      return pastedImage !== null;
    },
  }))
);

// Selectors for better performance
export const usePastedImage = () =>
  useMessageActionStore((state) => state.pastedImage);
export const useReplyTo = () => useMessageActionStore((state) => state.replyTo);
export const useEditMessage = () =>
  useMessageActionStore((state) => state.editMessage);
export const useChatId = () => useMessageActionStore((state) => state.chatId);
export const useCurrentChat = () =>
  useMessageActionStore((state) => state.currentChat);
export const useSelectedUser = () =>
  useMessageActionStore((state) => state.selectedUser);
export const useUsers = () => useMessageActionStore((state) => state.users);
export const useChats = () => useMessageActionStore((state) => state.chats);

// Action selectors
export const useMessageActions = () =>
  useMessageActionStore((state) => ({
    setPastedImage: state.setPastedImage,
    clearPastedImage: state.clearPastedImage,
    setReplyTo: state.setReplyTo,
    clearReply: state.clearReply,
    setEditMessage: state.setEditMessage,
    clearEdit: state.clearEdit,
    hasPastedImage: state.hasPastedImage,
  }));

export const useChatActions = () =>
  useMessageActionStore((state) => ({
    setChatIdTo: state.setChatIdTo,
    clearChat: state.clearChat,
    setChats: state.setChats,
    setCurrentChat: state.setCurrentChat,
    clearCurrentChat: state.clearCurrentChat,
  }));

export const useUserActions = () =>
  useMessageActionStore((state) => ({
    setUsers: state.setUsers,
    setSelectedUser: state.setSelectedUser,
    clearSelectedUser: state.clearSelectedUser,
  }));
