// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken } from "firebase/messaging";
// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Firestore instance
const db = getFirestore(app);

// Get Firebase authentication and provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);
const messaging = getMessaging(app);

navigator.serviceWorker
  .register("/firebase-messaging-sw.js")
  .then((registration) => {
    return getToken(messaging, {
      vapidKey:
        "BF_k7as4bzLHQseEEfXlODjuay9g_JfPK2dRrXcYo4_QaWw9yrgAhsR7D12h1Csad8Nr9-vJfIVxD463ZiweNc0",
      serviceWorkerRegistration: registration,
    });
  })
  .then((token) => {
    console.log("FCM token:", token);
  })
  .catch((err) => {
    console.error("Error getting FCM token", err);
  });

export { auth, provider, db, storage, messaging };
