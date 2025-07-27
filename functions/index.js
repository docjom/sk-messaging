import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

// Trigger when a new message is added
export const sendMessageNotification = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const messageData = event.data?.data();
    const { chatId } = event.params;

    if (!messageData) return;

    try {
      // Get chat participants (excluding sender)
      const chatDoc = await db.collection("chats").doc(chatId).get();
      const chatData = chatDoc.data();
      const recipients = chatData.participants.filter(
        (id) => id !== messageData.senderId
      );

      // Get sender info
      const senderDoc = await db
        .collection("users")
        .doc(messageData.senderId)
        .get();
      const senderName = senderDoc.data()?.displayName || "Someone";

      // Send notifications to all recipients
      for (const recipientId of recipients) {
        await sendNotificationToUser(
          recipientId,
          senderName,
          messageData.text,
          chatId,
          messageData.senderId
        );
      }
    } catch (error) {
      console.error("Error in sendMessageNotification:", error);
    }
  }
);

const sendNotificationToUser = async (
  recipientId,
  senderName,
  messageText,
  chatId,
  senderId
) => {
  try {
    const userTokens = await getUserFCMTokens(recipientId);

    if (userTokens.length === 0) return;

    const message = {
      notification: {
        title: `New message from ${senderName}`,
        body:
          messageText.length > 50
            ? messageText.substring(0, 50) + "..."
            : messageText,
        icon: "/icon-192x192.png",
      },
      data: {
        chatId: chatId,
        senderId: senderId,
        type: "chat-message",
      },
      tokens: userTokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log("Notifications sent:", response.successCount);
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};

const getUserFCMTokens = async (userId) => {
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data();
  return userData?.fcmTokens || [];
};
