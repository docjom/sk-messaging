import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export const CreateGroupTopic = ({ chatId, currentUserId, onClose }) => {
  const handleCreateTopic = async () => {
    try {
      const topicRef = collection(db, "chats", chatId, "topics");
      const chatDocRef = doc(db, "chats", chatId);

      const chatSnap = await getDoc(chatDocRef);
      let members = [];

      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        members = chatData.users || [];
      }

      await setDoc(
        chatDocRef,
        {
          hasChatTopic: true,
        },
        { merge: true }
      );

      await addDoc(topicRef, {
        name: "General",
        createdBy: currentUserId,
        createdAt: serverTimestamp(),
        lastSenderName: "",
        lastMessage: "",
        lastMessageTime: "",
        users: members,
      });
      if (onClose) onClose();
    } catch (error) {
      console.error("Error creating topic:", error);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="border w-full flex justify-start my-1"
        >
          Create Topic
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Topic Creation</AlertDialogTitle>
          <AlertDialogDescription>
            This will create a new topic named <strong>"General"</strong> in
            this chat group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreateTopic}>
            Create
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
