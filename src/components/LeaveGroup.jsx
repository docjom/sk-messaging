import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

export function LeaveGroup({ chatId, currentUserId, onLeaveSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnlyAdmin, setIsOnlyAdmin] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState("");

  // when dialog opens, check if I'm the only admin
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);
      if (!snap.exists()) return;

      const { userRoles = {}, users = [] } = snap.data();
      const amAdmin = userRoles[currentUserId] === "admin";
      const adminCount = Object.values(userRoles).filter(
        (role) => role === "admin"
      ).length;
      const only = amAdmin && adminCount === 1;
      setIsOnlyAdmin(only);

      if (only) {
        // prepare dropdown of other non-admins
        const others = users.filter((uid) => uid !== currentUserId);
        const details = await Promise.all(
          others.map(async (uid) => {
            const uSnap = await getDoc(doc(db, "users", uid));
            return { id: uid, name: uSnap.data()?.displayName || "Unknown" };
          })
        );
        setAvailableUsers(details);
        setShowTransfer(true);
      } else {
        setShowTransfer(false);
      }
    })();
  }, [isOpen, chatId, currentUserId]);

  const proceedWithLeaving = async () => {
    // send system message + remove user
    const chatRef = doc(db, "chats", chatId);
    const userRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userRef);
    const name = userSnap.data()?.displayName || "Someone";

    const batch = writeBatch(db);
    batch.update(chatRef, {
      users: arrayRemove(currentUserId),
      [`userRoles.${currentUserId}`]: null, // Remove user role
      lastMessage: `${name} left`,
      lastMessageTime: serverTimestamp(),
    });
    const msgRef = collection(db, "chats", chatId, "messages");
    batch.set(doc(msgRef), {
      senderId: currentUserId,
      message: `${name} left the chat`,
      timestamp: serverTimestamp(),
      type: "system",
    });
    await batch.commit();

    toast.success("You have left the group");
    setIsOpen(false);
    onLeaveSuccess?.();
  };

  const handleLeave = async (e) => {
    e.preventDefault();

    // Prevent leaving if user is the only admin
    if (isOnlyAdmin) {
      toast.error("You must transfer admin rights before leaving");
      return;
    }

    setLoading(true);
    try {
      await proceedWithLeaving();
    } catch {
      toast.error("Could not leave. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedNewAdmin) {
      toast.error("Select someone to transfer to");
      return;
    }
    setLoading(true);
    try {
      const chatRef = doc(db, "chats", chatId);
      // grant admin role
      await updateDoc(chatRef, {
        [`userRoles.${selectedNewAdmin}`]: "admin",
      });
      // announce
      const uSnap = await getDoc(doc(db, "users", selectedNewAdmin));
      const newName = uSnap.data()?.displayName || "Someone";
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUserId,
        message: `${newName} is now admin`,
        timestamp: serverTimestamp(),
        type: "system",
      });
      // then leave
      await proceedWithLeaving();
    } catch {
      toast.error("Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // reset on close
          setShowTransfer(false);
          setSelectedNewAdmin("");
          setAvailableUsers([]);
          setIsOnlyAdmin(false);
        }
        setIsOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full border">
          Leave Group
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleLeave}>
          <DialogHeader>
            <DialogTitle>
              {showTransfer ? "Transfer Admin" : "Leave Group"}
            </DialogTitle>
            <DialogDescription>
              {showTransfer
                ? "You are the only admin. Select a new admin before you leave."
                : "Are you sure you want to leave?"}
            </DialogDescription>
          </DialogHeader>

          {showTransfer && (
            <div className="py-4">
              <label className="block mb-2">New Admin:</label>
              <Select
                value={selectedNewAdmin}
                onValueChange={setSelectedNewAdmin}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose member" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            {showTransfer ? (
              <Button onClick={handleTransfer} disabled={loading}>
                {loading ? "Transferring…" : "Transfer & Leave"}
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? "Leaving…" : "Leave"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
