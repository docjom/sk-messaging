import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";

export const CreateNewTopic = () => {
  const { chatId } = useMessageActionStore();
  const { user } = useUserStore();
  const [topicName, setTopicName] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const createTopic = async (e) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    setCreating(true);
    try {
      const topicRef = collection(db, "chats", chatId, "topics");
      await addDoc(topicRef, {
        name: topicName.trim(),
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        lastSenderName: "",
        lastMessage: "",
        lastMessageTime: "",
        pin: [],
      });

      toast(`Topic ${topicName.trim()} created!`);
      setTopicName("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating topic:", error);
      toast.error("Error creating topic");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 0 21 21"
          >
            <g
              fill="none"
              fillRule="evenodd"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
            >
              <path d="M10 4.5H5.5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V11" />
              <path d="M17.5 3.467a1.46 1.46 0 0 1-.017 2.05L10.5 12.5l-3 1l1-3l6.987-7.046a1.41 1.41 0 0 1 1.885-.104zm-2 2.033l.953 1" />
            </g>
          </svg>{" "}
          Create new topic
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={createTopic}>
          <DialogHeader>
            <DialogTitle>New topic</DialogTitle>
            <DialogDescription>
              Please input the name of your topic
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="topic-name">Choose a topic name</Label>
              <Input
                id="topic-name"
                name="name"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="What do you want to discuss?"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
