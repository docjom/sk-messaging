import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";
import { db } from "../firebase";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function GroupMembers({ chatId }) {
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full border flex justify-between items-center"
        >
          Members <span>{members.length}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
          {loading && <p>Loading…</p>}
          {!loading && members.length === 0 && <p>No members found.</p>}
          {!loading &&
            members.map((m) => (
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
                    <p className="font-medium capitalize">{m.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {m.email}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                  {m.role}
                </span>
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
  );
}
