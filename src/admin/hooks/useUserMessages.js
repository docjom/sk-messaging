import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

const getUserMessages = async (uid, messageLimit = 50) => {
  try {
    const userMessagesRef = collection(db, "userMessages", uid, "messages");
    const messagesQ = query(
      userMessagesRef,
      orderBy("timestamp", "desc"),
      limit(messageLimit)
    );

    const messagesSnap = await getDocs(messagesQ);

    const allMessages = messagesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return allMessages;
  } catch (error) {
    console.error("Error fetching user messages:", error);
    return [];
  }
};

export default getUserMessages;
