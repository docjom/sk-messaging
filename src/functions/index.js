// functions/index.js
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

// Trigger when a new message is added to Firestore
export const sendMessageNotification = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    try {
      const messageData = event.data?.data();
      const { chatId, messageId } = event.params;

      console.log(
        "🚀 New message trigger fired for chat:",
        chatId,
        "message:",
        messageId
      );

      if (!messageData) {
        console.log("❌ No message data found");
        return;
      }

      console.log("📄 Message data:", JSON.stringify(messageData, null, 2));

      // Validate required fields
      if (!messageData.senderId) {
        console.error("❌ Missing senderId in message data");
        return;
      }

      if (!messageData.message) {
        console.log("⚠️ Message has no text or type - skipping notification");
        return;
      }

      // Get chat users (excluding sender)
      const chatDoc = await db.collection("chats").doc(chatId).get();

      if (!chatDoc.exists) {
        console.error("❌ Chat document not found:", chatId);
        return;
      }

      const chatData = chatDoc.data();
      console.log("💬 Chat data:", JSON.stringify(chatData, null, 2));

      const recipients =
        chatData.users?.filter((id) => id !== messageData.senderId) || [];

      console.log("👥 Recipients found:", recipients);

      if (recipients.length === 0) {
        console.log("⚠️ No recipients to notify");
        return;
      }

      // Get sender info
      const senderDoc = await db
        .collection("users")
        .doc(messageData.senderId)
        .get();
      const senderData = senderDoc.exists ? senderDoc.data() : null;
      const senderName =
        senderData?.displayName || senderData?.name || "Someone";

      console.log("👤 Sender name:", senderName);

      // Get chat name if it's a group chat
      const chatName =
        chatData.name || (recipients.length > 1 ? "Group Chat" : null);

      // Send notifications to all recipients
      const notificationPromises = recipients.map((recipientId) =>
        sendNotificationToUser(
          recipientId,
          senderName,
          messageData.text || "Sent a message",
          chatId,
          messageData.senderId,
          chatName
        )
      );

      await Promise.allSettled(notificationPromises);
      console.log("✅ All notifications processed");
    } catch (error) {
      console.error("❌ Error in sendMessageNotification:", error);
    }
  }
);

const sendNotificationToUser = async (
  recipientId,
  senderName,
  messageText,
  chatId,
  senderId,
  chatName = null
) => {
  try {
    console.log("📨 Sending notification to user:", recipientId);

    // Check if user exists and is active
    const recipientDoc = await db.collection("users").doc(recipientId).get();
    if (!recipientDoc.exists) {
      console.log("⚠️ Recipient user not found:", recipientId);
      return;
    }

    const recipientData = recipientDoc.data();

    // Check if user has notifications enabled (optional feature)
    if (recipientData.notificationsEnabled === false) {
      console.log("🔕 Notifications disabled for user:", recipientId);
      return;
    }

    // Get recipient's FCM tokens
    const userTokens = await getUserFCMTokens(recipientId);

    console.log(
      `🔑 Found ${userTokens.length} FCM tokens for user:`,
      recipientId
    );

    if (userTokens.length === 0) {
      console.log("⚠️ No FCM tokens found for user:", recipientId);
      return;
    }

    // Create notification title based on context
    const notificationTitle = chatName
      ? `${senderName} in ${chatName}`
      : `New message from ${senderName}`;

    // Truncate message text for notification
    const truncatedText =
      messageText && messageText.length > 100
        ? messageText.substring(0, 100) + "..."
        : messageText || "New message";

    const message = {
      notification: {
        title: notificationTitle,
        body: truncatedText,
        icon: "/icon-192x192.png",
      },
      data: {
        chatId: String(chatId),
        senderId: String(senderId),
        senderName: String(senderName),
        type: "chat-message",
        clickAction: `/chat/${chatId}`, // Add click action for better UX
        timestamp: String(Date.now()),
      },
      // Android specific options
      android: {
        notification: {
          icon: "/icon-192x192.png",
          color: "#4285f4", // Your app's primary color
          sound: "default",
          channelId: "chat_messages", // Make sure this channel exists in your app
          priority: "high",
        },
        data: {
          chatId: String(chatId),
          senderId: String(senderId),
          type: "chat-message",
        },
      },
      // Apple specific options
      apns: {
        payload: {
          aps: {
            alert: {
              title: notificationTitle,
              body: truncatedText,
            },
            sound: "default",
            badge: 1, // You might want to calculate actual unread count
          },
        },
        fcmOptions: {
          imageUrl: "/icon-192x192.png",
        },
      },
      // Web specific options
      webpush: {
        headers: {
          TTL: "300", // 5 minutes
        },
        notification: {
          title: notificationTitle,
          body: truncatedText,
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          tag: `chat-${chatId}`, // Replace previous notifications from same chat
          requireInteraction: true,
          data: {
            chatId: String(chatId),
            senderId: String(senderId),
            clickAction: `/chat/${chatId}`,
          },
          actions: [
            {
              action: "open",
              title: "Open Chat",
            },
            {
              action: "dismiss",
              title: "Dismiss",
            },
          ],
        },
        fcmOptions: {
          link: `/chat/${chatId}`,
        },
      },
      tokens: userTokens,
    };

    console.log("📤 Sending FCM message:", {
      title: message.notification.title,
      body: message.notification.body,
      tokenCount: userTokens.length,
      recipient: recipientId,
    });

    const response = await messaging.sendEachForMulticast(message);
    console.log(
      `✅ Notifications sent successfully: ${response.successCount}/${userTokens.length}`
    );

    if (response.failureCount > 0) {
      console.log("❌ Notifications failed:", response.failureCount);

      // Log individual failures for debugging
      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${index}:`, {
            error: resp.error?.message,
            errorCode: resp.error?.code,
            token: userTokens[index].substring(0, 20) + "...", // Log partial token for debugging
          });
        }
      });

      await cleanupInvalidTokens(recipientId, userTokens, response.responses);
    }

    return response;
  } catch (error) {
    console.error(
      "❌ Error sending notifications to user:",
      recipientId,
      error
    );
    throw error; // Re-throw to handle in calling function
  }
};

const getUserFCMTokens = async (userId) => {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      console.log("❌ User document not found:", userId);
      return [];
    }

    const userData = userDoc.data();
    let tokens = userData?.fcmTokens || [];

    // Handle both array and object formats
    if (typeof tokens === "object" && !Array.isArray(tokens)) {
      tokens = Object.values(tokens);
    }

    // Filter out invalid tokens
    tokens = tokens.filter(
      (token) => token && typeof token === "string" && token.length > 50
    );

    console.log(`🔑 User ${userId} has ${tokens.length} valid FCM tokens`);

    // Log first few characters of each token for debugging
    tokens.forEach((token, index) => {
      console.log(`Token ${index}: ${token.substring(0, 20)}...`);
    });

    return tokens;
  } catch (error) {
    console.error("❌ Error getting FCM tokens for user:", userId, error);
    return [];
  }
};

const cleanupInvalidTokens = async (userId, tokens, responses) => {
  try {
    const invalidTokens = [];
    const validTokens = [];

    responses.forEach((response, index) => {
      const token = tokens[index];
      if (!response.success) {
        // Check if it's a registration token error (invalid/expired token)
        const errorCode = response.error?.code;
        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(token);
          console.log(
            `🗑️ Marking token as invalid: ${token.substring(
              0,
              20
            )}... (${errorCode})`
          );
        } else {
          validTokens.push(token);
          console.log(
            `⚠️ Keeping token despite error: ${token.substring(
              0,
              20
            )}... (${errorCode})`
          );
        }
      } else {
        validTokens.push(token);
      }
    });

    if (invalidTokens.length > 0) {
      console.log(
        `🧹 Cleaning up ${invalidTokens.length} invalid tokens for user: ${userId}`
      );

      // Remove invalid tokens
      await db
        .collection("users")
        .doc(userId)
        .update({
          fcmTokens: FieldValue.arrayRemove(...invalidTokens),
        });

      console.log("✅ Invalid tokens removed successfully");
    }

    // Optional: Log remaining valid token count
    console.log(`📊 User ${userId} now has ${validTokens.length} valid tokens`);
  } catch (error) {
    console.error("❌ Error cleaning up invalid tokens:", error);
  }
};

// Optional: Add a test function for debugging
export const testNotification = onDocumentCreated(
  "test/{testId}",
  async (event) => {
    try {
      const testData = event.data?.data();
      console.log("🧪 Test notification triggered:", testData);

      if (testData?.userId) {
        await sendNotificationToUser(
          testData.userId,
          "Test Sender",
          "This is a test notification",
          "test-chat-id",
          "test-sender-id"
        );
      }
    } catch (error) {
      console.error("❌ Test notification error:", error);
    }
  }
);
