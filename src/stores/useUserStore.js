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
    // Prevent multiple listeners
    if (get().unsubscribeAuth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Always set initialized to true once we get the first auth state change
      set({ initialized: true });

      if (currentUser) {
        set({ user: currentUser });
        get().subscribeToUserProfile(currentUser.uid);
      } else {
        set({
          user: null,
          userProfile: null,
        });
        // Clean up profile subscription if user logs out
        const { unsubscribeProfile } = get();
        if (unsubscribeProfile) {
          unsubscribeProfile();
          set({ unsubscribeProfile: null });
        }
      }
    });

    set({ unsubscribeAuth: unsubscribe });
  },

  subscribeToUserProfile: (uid) => {
    // Clean up existing profile subscription
    const { unsubscribeProfile } = get();
    if (unsubscribeProfile) {
      unsubscribeProfile();
    }

    const userRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        set({ userProfile: { id: docSnap.id, ...docSnap.data() } });
      } else {
        set({ userProfile: null });
      }
    });

    set({ unsubscribeProfile: unsubscribe });
  },

  cleanup: () => {
    const { unsubscribeAuth, unsubscribeProfile } = get();
    if (unsubscribeAuth) {
      unsubscribeAuth();
    }
    if (unsubscribeProfile) {
      unsubscribeProfile();
    }
    set({
      user: null,
      userProfile: null,
      initialized: false,
      unsubscribeAuth: null,
      unsubscribeProfile: null,
    });
  },
}));
