// stores/useMessageActionStore.js
import { create } from 'zustand';

export const useMessageActionStore = create((set) => ({
  replyTo: null,
  editMessage: null,

  setReplyTo: (data) => set({ replyTo: data, editMessage: null }),
  clearReply: () => set({ replyTo: null }),

  setEditMessage: (data) => set({ editMessage: data, replyTo: null }),
  clearEdit: () => set({ editMessage: null }),
}));
