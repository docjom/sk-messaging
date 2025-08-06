// stores/useFolderStore.js
import { create } from "zustand";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase";

export const useFolderStore = create((set, get) => ({
  hasFolders: false,
  isLoading: false,

  folders: [],
  setFolders: (folders) => set({ folders }),

  // Check if user has folders (called once on app init)
  checkUserHasFolders: async (userId) => {
    set({ isLoading: true });
    try {
      const userDoc = doc(db, "users", userId);
      const userSnapshot = await getDoc(userDoc);
      const hasFolders = userSnapshot.data()?.hasFolders || false;
      set({ hasFolders });
    } catch (error) {
      console.error("Error checking folders:", error);
      set({ hasFolders: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // Update user's hasFolders status
  updateUserHasFolders: async (userId, hasFolders) => {
    try {
      const userDoc = doc(db, "users", userId);
      await updateDoc(userDoc, { hasFolders });
      set({ hasFolders });
    } catch (error) {
      console.error("Error updating hasFolders:", error);
    }
  },

  // Set hasFolders to true (when creating first folder)
  setHasFolders: (userId) => {
    get().updateUserHasFolders(userId, true);
  },

  // Check and update hasFolders status (when deleting folders)
  checkAndUpdateHasFolders: async (userId) => {
    try {
      const foldersQuery = query(
        collection(db, "folders"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(foldersQuery);
      const hasFolders = snapshot.size > 0;

      await get().updateUserHasFolders(userId, hasFolders);
    } catch (error) {
      console.error("Error checking folders count:", error);
    }
  },
}));
