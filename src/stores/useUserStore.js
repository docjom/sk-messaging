// stores/useUserStore.js
import { create } from "zustand";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { auth, db } from "../firebase";

export const useUserStore = create((set) => ({
  user: null,
  userProfile: null,
  initialized: false,
  unsubscribeAuth: null,
  unsubscribeProfile: null,

  initAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        set({ user: currentUser });
        useUserStore.getState().subscribeToUserProfile(currentUser.uid);
      } else {
        set({ user: null, userProfile: null });
      }
    });
    set({ unsubscribeAuth: unsubscribe });
  },

  subscribeToUserProfile: (uid) => {
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
    const { unsubscribeAuth, unsubscribeProfile } = useUserStore.getState();
    if (unsubscribeAuth) unsubscribeAuth();
    if (unsubscribeProfile) unsubscribeProfile();
    set({
      user: null,
      userProfile: null,
      unsubscribeAuth: null,
      unsubscribeProfile: null,
    });
  },
}));
