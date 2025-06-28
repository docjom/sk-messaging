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
import { doc, arrayRemove, writeBatch } from "firebase/firestore";
import { Icon } from "@iconify/react";

export const DeleteUserChat = ({ chatId, currentUserId, clearCurrentChat }) => {
  const [loading, setLoading] = useState(false);

  const proceedWithDeleting = async () => {
    const chatRef = doc(db, "chats", chatId);

    const batch = writeBatch(db);
    batch.update(chatRef, {
      users: arrayRemove(currentUserId),
    });
    await batch.commit();
    toast.success("You have delete your conversation");
    clearCurrentChat?.();
  };

  const handleDeleteChat = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      await proceedWithDeleting();
    } catch {
      toast.error("Could not delete conversation. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={"ghost"} className="text-red-500">
            {" "}
            <Icon icon="fluent:delete-48-regular" width="20" height="20" />
            Delete Chat
          </Button>
        </DialogTrigger>

        <DialogContent>
          <form onSubmit={handleDeleteChat}>
            <DialogHeader>
              <DialogTitle>Delete Chat</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this conversation?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={loading}>
                {loading ? "Deleting" : "Delete Chat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
