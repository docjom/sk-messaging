// stores/useMessageActionStore.js
import { create } from "zustand";

export const useMessageActionStore = create((set, get) => ({
  replyTo: null,
  editMessage: null,
  pastedImage: null,

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
