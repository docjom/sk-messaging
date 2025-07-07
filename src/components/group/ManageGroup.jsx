import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  documentId,
  updateDoc,
  arrayRemove,
  deleteField,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export function ManageGroupMembers({ chatId, currentUserId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    (async () => {
      const chatSnap = await getDoc(doc(db, "chats", chatId));
      if (!chatSnap.exists()) {
        setMembers([]);
        setLoading(false);
        return;
      }
      const { users: userIds = [], userRoles = {} } = chatSnap.data();

      const batches = [];
      for (let i = 0; i < userIds.length; i += 10) {
        batches.push(userIds.slice(i, i + 10));
      }

      const fetched = [];
      for (const batch of batches) {
        const q = query(
          collection(db, "users"),
          where(documentId(), "in", batch)
        );
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            displayName: data.displayName,
            email: data.email,
            photoURL: data.photoURL,
            role: userRoles[docSnap.id] || "member",
          });
        });
      }

      setMembers(fetched);
      setLoading(false);
    })();
  }, [chatId]);

  const handleRemoveMember = async (memberId, memberName) => {
    try {
      // Get admin name (current user)
      const adminDoc = await getDoc(doc(db, "users", currentUserId));
      const adminName = adminDoc.exists()
        ? adminDoc.data().displayName
        : "Admin";

      // Remove user from the group
      await updateDoc(doc(db, "chats", chatId), {
        users: arrayRemove(memberId),
        [`userRoles.${memberId}`]: deleteField(),
      });

      // Send system message notifying the group
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        senderId: currentUserId,
        message: `${memberName} has been removed from the group by ${adminName}`,
        timestamp: serverTimestamp(),
        type: "system",
      });

      // Update local state
      setMembers((prev) => prev.filter((m) => m.id !== memberId));

      // Show success toast
      toast(`${memberName} removed from the group`);
    } catch (e) {
      console.error("Error removing member:", e);
      toast.error(`Failed to remove ${memberName}`, { type: "error" });
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full border flex justify-start items-center"
          >
            Manage Members
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Click a member to remove</DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
            {loading && <p>Loading…</p>}
            {!loading &&
              members.filter((m) => m.role !== "admin").length === 0 && (
                <p>No removable members found.</p>
              )}

            {!loading &&
              members
                .filter((m) => m.role !== "admin")
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-2 hover:bg-gray-100 hover:dark:bg-gray-700 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        {m.photoURL ? (
                          <AvatarImage src={m.photoURL} />
                        ) : (
                          <AvatarFallback>{m.displayName?.[0]}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium capitalize">
                          {m.displayName}
                        </p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="link" className="text-red-500">
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {m.displayName} from
                            the group?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleRemoveMember(m.id, m.displayName)
                            }
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
