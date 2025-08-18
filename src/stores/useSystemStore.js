import { create } from "zustand";

export const useSystemStore = create((set) => ({
  isSystemUnderMaintenance: false,
  setSystemUnderMaintenance: (data) => set({ isSystemUnderMaintenance: data }),
}));
