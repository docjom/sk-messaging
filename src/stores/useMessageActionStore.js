// stores/useMessageActionStore.js
import { create } from "zustand";

export const useMessageActionStore = create((set, get) => ({
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
}));
