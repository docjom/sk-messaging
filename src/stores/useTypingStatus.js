import { create } from "zustand";

export const useTypingStatus = create((set) => ({
  typingUsers: {},
  setTypingUsers: (data) => set({ typingUsers: data }),
}));
