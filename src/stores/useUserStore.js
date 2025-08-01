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
    if (get().unsubscribeAuth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      set({ initialized: true });

      if (currentUser) {
        set({ user: currentUser });
        get().subscribeToUserProfile(currentUser.uid);
      } else {
        set({
          user: null,
          userProfile: null,
        });
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
