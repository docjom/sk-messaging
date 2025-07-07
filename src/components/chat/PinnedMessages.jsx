import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const PinnedMessages = ({ chatId }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);

  useEffect(() => {
    const fetchPinnedMessages = async () => {
      try {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(
          messagesRef,
          where("pinned", "==", true),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);

        const messagesWithUserData = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const msgData = docSnap.data();
            const userRef = doc(db, "users", msgData.senderId);
            const userSnap = await getDoc(userRef);

            return {
              id: docSnap.id,
              message: msgData.message,
              timestamp: msgData.timestamp?.toDate(),
              senderId: msgData.senderId,
              user: userSnap.exists()
                ? {
                    name: userSnap.data().displayName,
                    photoURL: userSnap.data().photoURL,
                  }
                : {
                    name: "Unknown",
                    photoURL: "",
                  },
            };
          })
        );

        setPinnedMessages(messagesWithUserData);
      } catch (err) {
        console.error("Error fetching pinned messages:", err);
      }
    };

    fetchPinnedMessages();
  }, [chatId]);

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={"ghost"} className=" flex w-full justify-start">
            {" "}
            <Icon icon="solar:pin-line-duotone" width="20" height="20" />
            Pinned Message
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pinned Messages</DialogTitle>
          </DialogHeader>
          {/* pinned messages list */}
          <div className="space-y-1 max-h-80 max-w-96 overflow-y-auto">
            {pinnedMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                No pinned messages.
              </p>
            ) : (
              pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-start justify-start gap-2 p-2 border rounded-lg"
                >
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={msg.user.photoURL || ""} />
                    <AvatarFallback>{msg.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="font-medium text-sm">{msg.user.name}</div>
                    <div className="text-sm border rounded-lg p-2 text-muted-foreground">
                      {msg.message}
                    </div>
                    <div className="text-xs text-gray-400">
                      {msg.timestamp?.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
