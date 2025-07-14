import { create } from "zustand";

export const useMenu = create((set) => ({
  menu: false,
  setMenu: (data) => set({ menu: data }),
}));

