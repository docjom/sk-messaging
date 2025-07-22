import {
  collection,
  query,
  getDocs,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { toast } from "sonner";
import { useUserStore } from "@/stores/useUserStore";

const { clearChat, clearCurrentChat, clearSelectedUser, users } =
  useMessageActionStore.getState();

const { user } = useUserStore.getState();

export const checkExistingDirectChat = async (selectedUserId) => {
  try {
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("type", "==", "direct"));
    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
      const chatData = doc.data();
      if (
        chatData.users.includes(user?.uid) &&
        chatData.users.includes(selectedUserId)
      ) {
        return { id: doc.id, ...chatData };
      }
    }
    return null;
  } catch (error) {
    console.error("Error checking existing chat:", error);
    return null;
  }
};

export const getSenderDisplayName = (senderId) => {
  const sender = users.find((u) => u.id === senderId);
  return sender?.displayName || "Unknown User";
};

export const getSenderData = (senderId) => {
  if (!senderId) return null;
  const sender = users.find((u) => u.id === senderId);
  return sender || null;
};

export const clearChatId = () => {
  clearChat();
  clearCurrentChat();
  clearSelectedUser();
};

export const createChat = async (type, userIds, name = "") => {
  try {
    const chatsRef = collection(db, "chats");
    const chatData = {
      type,
      name: name || (type === "direct" ? "Direct Chat" : "Group Chat"),
      users: userIds,
      pin: [],
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: null,
    };
    if (type === "direct") {
      const otherUserId = userIds.find((id) => id !== user?.uid);
      const otherUser = users.find((u) => u.id === otherUserId);
      chatData.photoURL = otherUser?.photoURL;
    } else if (type === "group") {
      chatData.photoURL = "";
      chatData.admin = user?.uid;
      chatData.userRoles = {};
      userIds.forEach((userId) => {
        chatData.userRoles[userId] = userId === user?.uid ? "admin" : "member";
      });
    }
    const chatDoc = await addDoc(chatsRef, chatData);
    return chatDoc.id;
  } catch (e) {
    toast.error("Failed to create chat. Please try again.", e);
    return null;
  }
};
