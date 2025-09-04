import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase";

const getUserMessages = async (uid) => {
  let allMessages = [];

  // 1. Get all chats
  const chatsSnapshot = await getDocs(collection(db, "chats"));

  // 2. Run all chat queries in parallel
  const chatPromises = chatsSnapshot.docs.map(async (chatDoc) => {
    const chatData = chatDoc.data();
    const chatId = chatDoc.id;

    if (!chatData.users || !chatData.users.includes(uid)) return [];

    const results = [];

    // 3. Direct chat messages
    const messagesRef = collection(db, "chats", chatId, "messages");
    const messagesQ = query(
      messagesRef,
      where("senderId", "==", uid),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const messagesSnap = await getDocs(messagesQ);

    messagesSnap.forEach((msgDoc) => {
      const msg = msgDoc.data();
      results.push({
        chatId,
        chatName: chatData.name || "Direct Chat",
        topicName: null,
        ...msg,
      });
    });

    // 4. Group topics (also parallel)
    if (chatData.type === "group") {
      const topicsRef = collection(db, "chats", chatId, "topics");
      const topicsSnap = await getDocs(topicsRef);

      const topicPromises = topicsSnap.docs.map(async (topicDoc) => {
        const topicData = topicDoc.data();
        const topicMessagesRef = collection(
          db,
          "chats",
          chatId,
          "topics",
          topicDoc.id,
          "messages"
        );
        const topicMessagesQ = query(
          topicMessagesRef,
          where("senderId", "==", uid),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        const topicMessagesSnap = await getDocs(topicMessagesQ);

        const topicResults = [];
        topicMessagesSnap.forEach((msgDoc) => {
          const msg = msgDoc.data();
          topicResults.push({
            chatId,
            chatName: chatData.name || "Group Chat",
            topicName: topicData.name,
            ...msg,
          });
        });

        return topicResults;
      });

      const topicMessages = await Promise.all(topicPromises);
      results.push(...topicMessages.flat());
    }

    return results;
  });

  const chatsResults = await Promise.all(chatPromises);

  // 5. Merge all results into one array
  allMessages = chatsResults.flat();

  // 6. Global sort + slice 50
  allMessages.sort((a, b) => b.timestamp - a.timestamp);
  return allMessages.slice(0, 50);
};
export default getUserMessages;
