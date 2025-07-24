import { create } from "zustand";

export const useMentions = create((set) => ({
  mentionSuggestions: [],
  setMentionSuggestions: (mentionSuggestions) => set({ mentionSuggestions }),
  clearMentionSuggestions: () => set({ mentionSuggestions: [] }),
}));
