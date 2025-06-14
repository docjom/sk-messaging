// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0OygZQqq03pp4BlCAOAmdwNReR2WrGSA",
  authDomain: "sk-messaging-ce99c.firebaseapp.com",
  projectId: "sk-messaging-ce99c",
  storageBucket: "sk-messaging-ce99c.firebasestorage.app",
  messagingSenderId: "304951243302",
  appId: "1:304951243302:web:0e7e729b4abaed61caece7",
  measurementId: "G-BFV1H7PZ9M",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Firestore instance
const db = getFirestore(app);

// Get Firebase authentication and provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, db };
