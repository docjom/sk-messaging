// stores/useUserStore.js
import { create } from "zustand";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { auth, db } from "../firebase";

export const useUserStore = create((set, get) => ({
  user: null,
  userProfile: null,
  initialized: false, // becomes true only after auth known AND profile loaded (if user)
  profileLoaded: false, // indicates first profile snapshot has arrived when user exists
  unsubscribeAuth: null,
  unsubscribeProfile: null,

  initAuthListener: () => {
    if (get().unsubscribeAuth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Reset profileLoaded whenever auth changes
      set({ profileLoaded: false });

      if (currentUser) {
        set({ user: currentUser });
        // Start listening to profile; initialized will flip true after first snapshot
        get().subscribeToUserProfile(currentUser.uid);
      } else {
        // No user: clear state and mark initialized immediately
        set({
          user: null,
          userProfile: null,
          initialized: true, // safe to render routes now (logged out)
          profileLoaded: true, // trivially true since no profile required
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
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          set({ userProfile: { id: docSnap.id, ...docSnap.data() } });
        } else {
          set({ userProfile: null });
        }
        // First snapshot received: profile has loaded. Now we can mark initialized.
        const { initialized } = get();
        if (!initialized) {
          set({ initialized: true, profileLoaded: true });
        }
      },
      (error) => {
        console.error("Profile subscription error:", error);
        // Even on error, avoid blocking the app; allow rendering and handle null profile
        const { initialized } = get();
        if (!initialized) {
          set({ initialized: true, profileLoaded: true });
        }
      }
    );

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
      profileLoaded: false,
      unsubscribeAuth: null,
      unsubscribeProfile: null,
    });
  },
}));
