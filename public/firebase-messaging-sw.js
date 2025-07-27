// firebase-messaging-sw.js

// Import Firebase scripts only in service worker context
if (typeof self !== "undefined" && typeof importScripts === "function") {
  self.importScripts(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
  );
  self.importScripts(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
  );

  // Initialize Firebase
  self.firebase.initializeApp({
    apiKey: "AIzaSyA9Q2Y7tVbL67ZIC1EzzeI10x1Wv1Gzc9U",
    authDomain: "web-app-messaging.firebaseapp.com",
    projectId: "web-app-messaging",
    storageBucket: "web-app-messaging.firebasestorage.app",
    messagingSenderId: "312333989577",
    appId: "1:312333989577:web:4637048b675c5ee7e2ff18",
    measurementId: "G-BJW9DN442W",
  });

  const messaging = self.firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log("Background Message received:", payload);

    // Extract notification data with fallbacks
    const notificationTitle =
      payload.notification?.title || payload.data?.title || "New Message";

    const notificationBody =
      payload.notification?.body ||
      payload.data?.body ||
      "You have a new message";

    const notificationOptions = {
      body: notificationBody,
      icon: payload.notification?.icon || "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: payload.data?.tag || "chat-message",
      requireInteraction: true,
      data: {
        ...payload.data,
        clickAction: payload.data?.clickAction || "/",
        timestamp: Date.now(),
      },
      actions: [
        {
          action: "open",
          title: "Open Chat",
          icon: "/open-icon.png", // Optional action icon
        },
        {
          action: "dismiss",
          title: "Dismiss",
          icon: "/dismiss-icon.png", // Optional action icon
        },
      ],
      // Additional options for better UX
      silent: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
    };

    // Show the notification
    return self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );
  });
}

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  // Close the notification
  event.notification.close();

  // Handle different actions
  if (event.action === "open") {
    // Get the URL to open from notification data or use default
    const urlToOpen = event.notification.data?.clickAction || "/";

    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (
              client.url.includes(self.location.origin) &&
              "focus" in client
            ) {
              // Focus existing window and navigate if needed
              return client.focus().then(() => {
                if (client.navigate && urlToOpen !== "/") {
                  return client.navigate(urlToOpen);
                }
              });
            }
          }
          // If no existing window, open a new one
          if (self.clients.openWindow) {
            return self.clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === "dismiss") {
    // Just close the notification (already handled above)
    console.log("Notification dismissed");
  } else {
    // Default action (clicking notification body)
    const urlToOpen = event.notification.data?.clickAction || "/";

    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (
              client.url.includes(self.location.origin) &&
              "focus" in client
            ) {
              return client.focus().then(() => {
                if (client.navigate && urlToOpen !== "/") {
                  return client.navigate(urlToOpen);
                }
              });
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Optional: Handle notification close events
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);
  // You can track notification dismissals here
});

// Optional: Service worker installation and activation
self.addEventListener("install", () => {
  console.log("Service Worker installing");
  self.skipWaiting(); // Activate immediately
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(self.clients.claim()); // Take control of all pages
});
