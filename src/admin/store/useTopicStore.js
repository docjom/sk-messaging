import { create } from "zustand";

export const useTopicId = create((set) => ({
  topicId: null,
  setTopicId: (topicId) => set({ topicId }),
  clearTopicId: () => set({ topicId: null }),
}));
