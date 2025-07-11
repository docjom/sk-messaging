import { create } from "zustand";

export const useMessageStore = create((set) => ({
  messages: [],
  setMessages: (msgs) => set({ messages: msgs }),
  addMessagesToTop: (msgs) =>
    set((state) => {
      const existingIds = new Set(state.messages.map((m) => m.id));
      const filtered = msgs.filter((m) => !existingIds.has(m.id));
      return { messages: [...filtered, ...state.messages] };
    }),
  addMessagesToBottom: (msgs) =>
    set((state) => {
      const existingIds = new Set(state.messages.map((m) => m.id));
      const filtered = msgs.filter((m) => !existingIds.has(m.id));
      return { messages: [...state.messages, ...filtered] };
    }),
  clearMessages: () => set({ messages: [] }),
}));
