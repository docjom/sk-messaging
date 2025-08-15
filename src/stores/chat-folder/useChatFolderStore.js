import { create } from "zustand";

export const useChatFolderStore = create((set) => ({
  folders: [],
  setFolders: (folders) => set({ folders }),

  selectedFolder: null,
  setSelectedFolder: (selectedFolder) => set({ selectedFolder }),
  clearSelectedFolder: () => set({ selectedFolder: null }),

  folderSidebar: false,
  setFolderSidebar: (data) => set({ folderSidebar: data }),

  addFolder: (folder) =>
    set((state) => ({
      folders: [...state.folders, folder],
    })),

  // ...more actions
}));
