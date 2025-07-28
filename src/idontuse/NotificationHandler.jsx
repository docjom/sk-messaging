// // components/NotificationHandler.jsx
// import { useEffect } from "react";
// import { toast } from "sonner";
// import { useNotifications } from "@/idontuse/useNotification";
// import { useUserStore } from "@/stores/useUserStore";

// export const NotificationHandler = () => {
//   const { permission, requestPermission, token, error, isSupported } =
//     useNotifications();
//   const { user } = useUserStore();

//   // Debug logging
//   useEffect(() => {
//     console.log("🔔 NotificationHandler Debug:", {
//       permission,
//       hasToken: !!token,
//       tokenPreview: token?.substring(0, 20) + "...",
//       error,
//       isSupported,
//       userId: user?.uid,
//       timestamp: new Date().toISOString(),
//     });
//   }, [permission, token, error, isSupported, user?.uid]);

//   // Show permission request toast
//   useEffect(() => {
//     if (permission === "default" && user?.uid) {
//       const timeoutId = setTimeout(() => {
//         toast("Enable Notifications", {
//           description: "Get notified when you receive new messages",
//           action: {
//             label: "Enable",
//             onClick: async () => {
//               console.log("🔔 User clicked enable notifications");
//               try {
//                 const result = await requestPermission();
//                 if (result) {
//                   toast.success("Notifications enabled successfully!");
//                 } else {
//                   toast.error("Failed to enable notifications");
//                 }
//               } catch (err) {
//                 console.error("❌ Error enabling notifications:", err);
//                 toast.error("Error enabling notifications: " + err.message);
//               }
//             },
//           },
//           duration: 10000, // Show for 10 seconds
//         });
//       }, 2000); // Wait 2 seconds after component mounts

//       return () => clearTimeout(timeoutId);
//     }
//   }, [permission, requestPermission, user?.uid]);

//   // Show error toast if there's an error
//   useEffect(() => {
//     if (error) {
//       console.error("🚨 Notification error:", error);
//       toast.error("Notification Error", {
//         description: error,
//         duration: 5000,
//       });
//     }
//   }, [error]);

//   // Show success when token is obtained
//   useEffect(() => {
//     if (token && permission === "granted") {
//       console.log("✅ Notifications fully enabled with token");
//       // Optional: Show success toast only once
//       const hasShownSuccess = localStorage.getItem(
//         "notification-success-shown"
//       );
//       if (!hasShownSuccess) {
//         toast.success("Notifications are now enabled!");
//         localStorage.setItem("notification-success-shown", "true");
//       }
//     }
//   }, [token, permission]);

//   // Warn if not supported
//   useEffect(() => {
//     if (!isSupported) {
//       console.warn("⚠️ Notifications not supported in this browser");
//       toast.warning("Notifications not supported in this browser");
//     }
//   }, [isSupported]);

//   return null;
// };
