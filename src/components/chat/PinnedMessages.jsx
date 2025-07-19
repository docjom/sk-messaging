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
import { Textarea } from "../ui/textarea";
import { query, orderBy, doc, getDoc, onSnapshot } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getRefs } from "@/utils/firestoreRefs";
import { useMessageActionStore } from "@/stores/useMessageActionStore";

export const PinnedMessages = ({ chatId }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { topicId } = useMessageActionStore();

  useEffect(() => {
    if (!chatId) return;
    setLoading(true);

    const { pinnedMessagesRef } = getRefs({ topicId, chatId });

    const q = query(pinnedMessagesRef, orderBy("pinnedAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const messagesWithUserData = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const pinnedData = docSnap.data();

            const userRef = doc(db, "users", pinnedData.senderId);
            const userSnap = await getDoc(userRef);

            const pinnedByUserRef = doc(db, "users", pinnedData.pinnedBy);
            const pinnedByUserSnap = await getDoc(pinnedByUserRef);

            return {
              id: docSnap.id,
              originalMessageId: pinnedData.originalMessageId,
              message: pinnedData.message,
              timestamp: pinnedData.timestamp?.toDate(),
              pinnedAt: pinnedData.pinnedAt?.toDate(),
              senderId: pinnedData.senderId,
              pinnedBy: pinnedData.pinnedBy,
              type: pinnedData.type || "text",
              fileData: pinnedData.fileData,
              forwarded: pinnedData.forwarded || false,
              forwardedAt: pinnedData.forwardedAt?.toDate(),
              user: userSnap.exists()
                ? {
                    name: userSnap.data().displayName,
                    photoURL: userSnap.data().photoURL,
                  }
                : {
                    name: "Unknown",
                    photoURL: "",
                  },
              pinnedByUser: pinnedByUserSnap.exists()
                ? {
                    name: pinnedByUserSnap.data().displayName,
                    photoURL: pinnedByUserSnap.data().photoURL,
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
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  const renderMessageContent = (msg) => {
    if (msg.type === "file" && msg.fileData) {
      return (
        <div className="space-y-2">
          {msg.message && (
            <Textarea
              value={msg.message}
              className=" max-w-85 max-h-80 resize-none border-none text-sm shadow-none sm:w-md whitespace-normal"
              readOnly
            />
          )}
          <div className="flex items-center gap-2 p-2  rounded-lg">
            <Icon icon="solar:paperclip-linear" width="16" height="16" />
            <span className="text-sm font-medium min-w-32 truncate">
              {msg.fileData.fileName || msg.fileData.name}
            </span>
            {msg.fileData.size && (
              <span className="text-xs text-gray-500">
                ({(msg.fileData.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="text-sm text-muted-foreground">
        {msg.message ? (
          <>
            {" "}
            <Textarea
              value={msg.message}
              className=" max-w-85 max-h-80 resize-none border-none text-sm shadow-none sm:w-md whitespace-normal"
              readOnly
            />
          </>
        ) : (
          <>No message content</>
        )}
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={"ghost"}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="flex w-full justify-start"
        >
          <Icon icon="solar:pin-line-duotone" width="20" height="20" />
          Pinned Messages
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:pin-line-duotone" width="20" height="20" />
            Pinned Messages
          </DialogTitle>
        </DialogHeader>

        {/* Pinned messages list */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Icon
                icon="solar:loading-linear"
                className="animate-spin"
                width="24"
                height="24"
              />
            </div>
          ) : pinnedMessages.length === 0 ? (
            <div className="text-center py-8">
              <Icon
                icon="solar:pin-line-duotone"
                width="48"
                height="48"
                className="mx-auto mb-3 text-gray-400"
              />
              <p className="text-sm text-muted-foreground">
                No pinned messages.
              </p>
            </div>
          ) : (
            pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 hover:dark:bg-gray-800 transition-colors"
              >
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={msg.user.photoURL || ""} />
                  <AvatarFallback>
                    {msg.user.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{msg.user.name}</span>
                    {msg.forwarded && (
                      <Badge variant="outline" className="text-xs">
                        <Icon
                          icon="solar:arrow-right-linear"
                          width="12"
                          height="12"
                          className="mr-1"
                        />
                        Forwarded
                      </Badge>
                    )}
                  </div>

                  <div className="border rounded-lg mb-2 ">
                    {renderMessageContent(msg)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{msg.timestamp?.toLocaleString()}</span>
                    <span className="flex items-center gap-1">
                      <Icon
                        icon="solar:pin-line-duotone"
                        width="12"
                        height="12"
                      />
                      Pinned by {msg.pinnedByUser.name}
                    </span>
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
  );
};
