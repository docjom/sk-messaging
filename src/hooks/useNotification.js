// hooks/useNotifications.js
import { useState, useEffect, useCallback } from "react";
import { getToken, onMessage } from "firebase/messaging";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { messaging, db } from "@/firebase";
import { useUserStore } from "@/stores/useUserStore";

export const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useUserStore();

  // Check if service worker is supported
  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window;

  const requestPermission = async () => {
    if (!isSupported) {
      setError("Notifications not supported in this browser");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("🔔 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        console.log("✅ Notification permission granted");

        // Register service worker if not already registered
        await registerServiceWorker();

        // Get FCM token
        const fcmToken = await getToken(messaging, {
          vapidKey:
            "BF_k7as4bzLHQseEEfXlODjuay9g_JfPK2dRrXcYo4_QaWw9yrgAhsR7D12h1Csad8Nr9-vJfIVxD463ZiweNc0",
        });

        if (fcmToken) {
          console.log(
            "🔑 FCM Token obtained:",
            fcmToken.substring(0, 20) + "..."
          );
          setToken(fcmToken);

          // Save token to database if user is authenticated
          if (user?.uid) {
            await saveTokenToDatabase(fcmToken);
          }

          return fcmToken;
        } else {
          throw new Error("Failed to get FCM token");
        }
      } else if (permission === "denied") {
        setError(
          "Notification permission denied. Please enable in browser settings."
        );
      } else {
        setError("Notification permission not granted");
      }
    } catch (error) {
      console.error("❌ Error getting notification permission:", error);
      setError(error.message || "Failed to request notification permission");
    } finally {
      setIsLoading(false);
    }

    return null;
  };

  const registerServiceWorker = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register(
          "firebase-messaging-sw.js"
        );
        console.log("✅ Service Worker registered:", registration);

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("🚀 Service Worker ready");

        return registration;
      }
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
      throw new Error("Failed to register service worker");
    }
  };

  const showLocalNotification = useCallback(
    (title, body, options = {}) => {
      if (permission === "granted" && document.hidden) {
        // Only show local notification if page is not visible
        const notification = new Notification(title, {
          body,
          icon: options.icon || "/icon-192x192.png",
          badge: "/badge-72x72.png",
          tag: options.tag || "chat-message",
          requireInteraction: options.requireInteraction || false,
          data: options.data || {},
          ...options,
        });

        // Handle notification click
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          notification.close();

          // Handle click action
          if (options.clickAction) {
            window.location.href = options.clickAction;
          }
        };

        // Auto close after 5 seconds if not requiring interaction
        if (!options.requireInteraction) {
          setTimeout(() => notification.close(), 5000);
        }
      }
    },
    [permission]
  );

  const saveTokenToDatabase = async (fcmToken) => {
    if (!user?.uid) {
      console.warn("⚠️ No user authenticated, cannot save FCM token");
      return;
    }

    try {
      console.log("💾 Saving FCM token to database...");

      const userRef = doc(db, "users", user.uid);

      // Check if user document exists
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const existingTokens = userData.fcmTokens || [];

        // Only add token if it doesn't already exist
        if (!existingTokens.includes(fcmToken)) {
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(fcmToken),
            lastTokenUpdate: new Date(),
          });
          console.log("✅ FCM token saved successfully");
        } else {
          console.log("ℹ️ FCM token already exists in database");
        }
      } else {
        // Create user document with token
        await updateDoc(userRef, {
          fcmTokens: [fcmToken],
          lastTokenUpdate: new Date(),
        });
        console.log("✅ User document created with FCM token");
      }
    } catch (error) {
      console.error("❌ Error saving FCM token:", error);
      setError("Failed to save notification token");
    }
  };

  const removeTokenFromDatabase = async (tokenToRemove) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(tokenToRemove),
      });
      console.log("🗑️ FCM token removed from database");
    } catch (error) {
      console.error("❌ Error removing FCM token:", error);
    }
  };

  // Initialize notifications when component mounts
  useEffect(() => {
    if (permission === "granted" && !token && user?.uid) {
      // Auto-request token if permission already granted
      getToken(messaging, {
        vapidKey:
          "BF_k7as4bzLHQseEEfXlODjuay9g_JfPK2dRrXcYo4_QaWw9yrgAhsR7D12h1Csad8Nr9-vJfIVxD463ZiweNc0",
      })
        .then((fcmToken) => {
          if (fcmToken) {
            setToken(fcmToken);
            saveTokenToDatabase(fcmToken);
          }
        })
        .catch(console.error);
    }
  }, [permission, token, user?.uid]);

  // Listen for foreground messages
  useEffect(() => {
    if (!isSupported) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📨 Foreground message received:", payload);

      // Extract notification data
      const title = payload.notification?.title || "New Message";
      const body = payload.notification?.body || "You have a new message";
      const icon = payload.notification?.icon;

      // Show local notification only if page is not focused
      showLocalNotification(title, body, {
        icon,
        tag: payload.data?.type || "chat-message",
        clickAction: payload.data?.clickAction || "/",
        data: payload.data,
        requireInteraction: true,
      });

      // Optional: You can also trigger custom app logic here
      // For example, update UI, play sound, etc.
      if (payload.data?.chatId) {
        // Handle chat-specific logic
        console.log("💬 Chat message from:", payload.data.chatId);
      }
    });

    return () => {
      console.log("🔇 Unsubscribing from foreground messages");
      unsubscribe();
    };
  }, [showLocalNotification, isSupported]);

  // Clean up token when user logs out
  useEffect(() => {
    if (!user && token) {
      setToken(null);
      setError(null);
    }
  }, [user, token]);

  return {
    permission,
    token,
    isLoading,
    error,
    isSupported,
    requestPermission,
    showLocalNotification,
    removeTokenFromDatabase,
    // Helper methods
    isPermissionGranted: permission === "granted",
    isPermissionDenied: permission === "denied",
    isPermissionDefault: permission === "default",
  };
};

// Export helper function for manual token refresh
export const refreshFCMToken = async () => {
  try {
    const newToken = await getToken(messaging, {
      vapidKey:
        "BF_k7as4bzLHQseEEfXlODjuay9g_JfPK2dRrXcYo4_QaWw9yrgAhsR7D12h1Csad8Nr9-vJfIVxD463ZiweNc0",
    });
    console.log("🔄 FCM token refreshed:", newToken?.substring(0, 20) + "...");
    return newToken;
  } catch (error) {
    console.error("❌ Error refreshing FCM token:", error);
    return null;
  }
};
