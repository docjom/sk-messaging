// stores/useUserStore.js
import { create } from "zustand";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { auth, db } from "../firebase";

export const useUserStore = create((set, get) => ({
  user: null,
  userProfile: null,
  initialized: false,
  unsubscribeAuth: null,
  unsubscribeProfile: null,

  initAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        set({ user: currentUser, initialized: true });
        get().subscribeToUserProfile(currentUser.uid);
      } else {
        // User logged out - clean up and mark as initialized
        get().cleanup();
        set({ user: null, userProfile: null, initialized: true });
      }
    });
    set({ unsubscribeAuth: unsubscribe });
  },

  subscribeToUserProfile: (uid) => {
    // Clean up existing profile subscription first
    const { unsubscribeProfile } = get();
    if (unsubscribeProfile) unsubscribeProfile();

    const userRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          set({ userProfile: { id: docSnap.id, ...docSnap.data() } });
        } else {
          // User document doesn't exist - this might be the issue
          console.warn(`User document not found for uid: ${uid}`);
          set({ userProfile: null });
        }
      },
      (error) => {
        console.error("Error subscribing to user profile:", error);
        set({ userProfile: null });
      }
    );
    set({ unsubscribeProfile: unsubscribe });
  },

  cleanup: () => {
    const { unsubscribeAuth, unsubscribeProfile } = get();
    if (unsubscribeAuth) unsubscribeAuth();
    if (unsubscribeProfile) unsubscribeProfile();
    set({
      unsubscribeAuth: null,
      unsubscribeProfile: null,
    });
  },
}));
