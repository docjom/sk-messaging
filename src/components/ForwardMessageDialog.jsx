import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { useMessageActionStore } from "@/stores/useMessageActionStore";

const ForwardMessageDialog = ({
  messageId,
  messageContent,
  currentUserId,
  originalFileData,
  isOpen,
  onClose,
}) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { chats } = useMessageActionStore();

  const groupChats = chats.filter((chat) => chat.type === "group");

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSelectedUsers([]);
      setSearchTerm("");
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.id !== currentUserId);
      setUsers(usersList);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const createChat = async (type, userIds, name = "") => {
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
        const otherUserId = userIds.find((id) => id !== currentUserId);
        const otherUser = users.find((u) => u.id === otherUserId);
        chatData.photoURL = otherUser?.photoURL || "";
      } else if (type === "group") {
        chatData.photoURL = "";
        chatData.admin = currentUserId;
        chatData.userRoles = {};
        userIds.forEach((userId) => {
          chatData.userRoles[userId] =
            userId === currentUserId ? "admin" : "member";
        });
      }
      const chatDoc = await addDoc(chatsRef, chatData);
      return chatDoc.id;
    } catch (e) {
      console.error("Failed to create chat:", e);
      return null;
    }
  };

  const handleForwardMessage = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to forward the message to.");
      return;
    }

    try {
      setForwarding(true);

      // Get current user's name
      const userSnap = await getDocs(collection(db, "users"));
      const currentUser = userSnap.docs.find((doc) => doc.id === currentUserId);
      const currentUserName = currentUser?.data()?.displayName || "Someone";

      // Get all existing chats where current user is a participant

      const batch = writeBatch(db);

      for (const target of selectedUsers) {
        let chatId = null;

        // If target is a chat ID (already exists)
        const isExistingChat = chats.find((chat) => chat.id === target);
        if (isExistingChat) {
          chatId = isExistingChat.id;
        } else {
          // Assume it's a user ID, create direct chat
          chatId = await createChat("direct", [currentUserId, target]);
          if (!chatId) {
            throw new Error("Failed to create chat");
          }
        }

        const msgRef = collection(db, "chats", chatId, "messages");
        const hasFile =
          originalFileData && Object.keys(originalFileData).length > 0;
        batch.set(doc(msgRef), {
          senderId: currentUserId,
          message: messageContent,
          timestamp: serverTimestamp(),
          fileData: hasFile ? originalFileData : null,
          type: hasFile ? "file" : "forwarded",
          forwarded: true,
          originalMessageId: messageId,
          forwardedAt: serverTimestamp(),
        });

        const chatRef = doc(db, "chats", chatId);
        batch.update(chatRef, {
          lastMessage: `${currentUserName} forwarded a message`,
          lastMessageTime: serverTimestamp(),
        });
      }

      await batch.commit();

      toast.success(
        `Message forwarded to ${selectedUsers.length} user${
          selectedUsers.length > 1 ? "s" : ""
        }`
      );

      onClose();
    } catch (error) {
      console.error("Failed to forward message:", error);
      toast.error("Failed to forward message. Please try again.");
    } finally {
      setForwarding(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <div className="max-h-60 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex justify-center py-4">
                <Icon
                  icon="solar:loading-linear"
                  className="animate-spin"
                  width="20"
                  height="20"
                />
              </div>
            ) : filteredUsers.length > 0 ? (
              <>
                {groupChats.length > 0 && (
                  <>
                    <div className="font-semibold text-sm text-gray-500">
                      Group Chats
                    </div>
                    {groupChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => handleUserSelect(chat.id)}
                      >
                        <Checkbox
                          checked={selectedUsers.includes(chat.id)}
                          onCheckedChange={() => handleUserSelect(chat.id)}
                        />
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={chat.photoURL} />
                          <AvatarFallback>
                            {chat.name?.charAt(0) || "G"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{chat.name}</p>
                          <p className="text-xs text-gray-500">Group</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserSelect(user.id)}
                    />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>
                        {user.displayName?.charAt(0) ||
                          user.email?.charAt(0) ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {user.displayName || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-center text-gray-500 py-4">No users found</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={forwarding}>
              Cancel
            </Button>
            <Button
              onClick={handleForwardMessage}
              disabled={forwarding || selectedUsers.length === 0}
            >
              {forwarding ? (
                <>
                  <Icon
                    icon="solar:loading-linear"
                    className="animate-spin mr-2"
                    width="16"
                    height="16"
                  />
                  Forwarding...
                </>
              ) : (
                `Forward to ${selectedUsers.length} user${
                  selectedUsers.length !== 1 ? "s" : ""
                }`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
