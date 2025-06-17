import { useState } from "react";
import { db } from "../firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export function LeaveGroup({ chatId, currentUserId, onLeaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLeaveGroup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get user's name first
      const userRef = doc(db, "users", currentUserId);
      const userSnap = await getDoc(userRef);
      const userName = userSnap.exists()
        ? userSnap.data().displayName
        : "Someone";

      const chatRef = doc(db, "chats", chatId);
      const messagesRef = collection(db, "chats", chatId, "messages");

      // Send system message
      await addDoc(messagesRef, {
        senderId: currentUserId,
        message: `${userName} left the chat`,
        timestamp: serverTimestamp(),
        type: "system",
      });

      // Update chat's last message
      await updateDoc(chatRef, {
        lastMessage: `${userName} left the chat`,
        lastMessageTime: serverTimestamp(),
      });

      // Remove user from group
      await updateDoc(chatRef, {
        users: arrayRemove(currentUserId),
      });

      toast("You have left the group successfully!");
      setIsOpen(false);
      if (onLeaveSuccess) {
        onLeaveSuccess();
      }
    } catch (error) {
      console.error("Error leaving group: ", error);
      toast("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="border w-full">
          Leave Group
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleLeaveGroup}>
          <DialogHeader>
            <DialogTitle>Leave Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this group?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Leaving..." : "Leave"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
