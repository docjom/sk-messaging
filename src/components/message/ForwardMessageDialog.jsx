import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
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

// User List Item Component
const UserListItem = ({ user, selected, onSelect }) => (
  <div
    className="flex items-center gap-3 p-3 hover:bg-gray-50 hover:dark:bg-gray-800 w-full border rounded-lg cursor-pointer"
    onClick={() => onSelect(user.id)}
  >
    <Checkbox checked={selected} onCheckedChange={() => onSelect(user.id)} />
    <Avatar className="w-8 h-8">
      <AvatarImage src={user.photoURL} />
      <AvatarFallback>
        {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
      </AvatarFallback>
    </Avatar>
    <div>
      <p className="font-medium text-sm truncate max-w-40 sm:max-w-96">
        {user.displayName || "Unknown"}
      </p>
      <p className="text-xs text-gray-500 truncate max-w-40 sm:max-w-96">
        {user.email}
      </p>
    </div>
  </div>
);

// Group Chat List Item Component
const GroupChatListItem = ({ chat, selected, onSelect }) => (
  <div
    className="flex items-center gap-3 p-3 hover:bg-gray-50 hover:dark:bg-gray-800 w-full border rounded-lg cursor-pointer"
    onClick={() => onSelect(chat.id)}
  >
    <Checkbox checked={selected} onCheckedChange={() => onSelect(chat.id)} />
    <Avatar className="w-8 h-8">
      <AvatarImage src={chat.photoURL} />
      <AvatarFallback>{chat.name?.charAt(0) || "G"}</AvatarFallback>
    </Avatar>
    <div>
      <p className="font-medium text-sm truncate max-w-40 sm:max-w-96">
        {chat.name}
      </p>
      <p className="text-xs text-gray-500">Group</p>
    </div>
  </div>
);

const ForwardMessageDialog = ({
  messageId,
  messageContent,
  currentUserId,
  originalFileData,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [forwarding, setForwarding] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { chats, users } = useMessageActionStore();

  // Memoized group chats
  const groupChats = useMemo(
    () => chats.filter((chat) => chat.type === "group"),
    [chats]
  );

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedUsers([]);
      setSearchTerm("");
    }
  }, [isOpen]);

  // Toggle user or chat selection
  const handleUserSelect = useCallback((userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const createChat = async (type, userIds, name = "") => {
    try {
      const chatsRef = collection(db, "chats");
      const chatData = {
        type,
        name:
          name ||
          (type === "direct"
            ? "Direct Chat"
            : type === "saved"
            ? "Saved Messages"
            : "Group Chat"),
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
      } else if (type === "saved") {
        // For saved messages, use current user's photo
        const currentUser = users.find((u) => u.id === currentUserId);
        chatData.photoURL = currentUser?.photoURL || "";
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

      // Batch forward message
      const batch = writeBatch(db);
      for (const target of selectedUsers) {
        let chatId = null;

        // Check if target is already a group chat ID
        const isExistingGroupChat = chats.find(
          (chat) => chat.id === target && chat.type === "group"
        );

        if (isExistingGroupChat) {
          // It's a group chat, use the existing chat ID
          chatId = isExistingGroupChat.id;
        } else {
          // It's a user ID, handle self-forwarding and regular forwarding
          if (target === currentUserId) {
            // Self-forwarding: find "Saved Messages" chat or create one
            const savedMessagesChat = chats.find(
              (chat) =>
                chat.type === "saved" ||
                (chat.type === "direct" &&
                  chat.users.length === 1 &&
                  chat.users[0] === currentUserId)
            );

            if (savedMessagesChat) {
              chatId = savedMessagesChat.id;
            } else {
              // Create a "Saved Messages" chat for self
              chatId = await createChat(
                "saved",
                [currentUserId],
                "Saved Messages"
              );
              if (!chatId)
                throw new Error("Failed to create saved messages chat");
            }
          } else {
            // Regular user forwarding: find existing direct chat or create new one
            const existingDirectChat = chats.find(
              (chat) =>
                chat.type === "direct" &&
                chat.users.includes(currentUserId) &&
                chat.users.includes(target) &&
                chat.users.length === 2 // Ensure it's a 2-person chat
            );

            if (existingDirectChat) {
              chatId = existingDirectChat.id;
            } else {
              chatId = await createChat("direct", [currentUserId, target]);
              if (!chatId) throw new Error("Failed to create chat");
            }
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

        if (messageContent && messageContent.match(/(https?:\/\/[^\s]+)/g)) {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const foundLinks = messageContent.match(urlRegex);
          const filesRef = collection(db, "chats", chatId, "files");
          for (const url of foundLinks) {
            await addDoc(filesRef, {
              senderId: currentUserId,
              type: "link",
              url,
              timestamp: serverTimestamp(),
            });
          }
        }

        if (hasFile) {
          const filesRef = collection(db, "chats", chatId, "files");
          await addDoc(filesRef, {
            senderId: currentUserId,
            fileData: {
              fileName: originalFileData?.name,
              url: originalFileData.url,
              name: originalFileData?.name,
              type: originalFileData?.type,
              size: originalFileData?.size,
            },
            timestamp: serverTimestamp(),
          });
        }

        const chatRef = doc(db, "chats", chatId);
        batch.update(chatRef, {
          lastMessage:
            target === currentUserId
              ? `You saved a message`
              : `${currentUserName} forwarded a message`,
          lastMessageTime: serverTimestamp(),
        });
      }

      await batch.commit();

      toast.success(
        `Message forwarded to ${
          selectedUsers.length
        } selected users or chats group${selectedUsers.length > 1 ? "s" : ""}`
      );

      onClose();
    } catch (error) {
      console.error("Failed to forward message:", error);
      toast.error("Failed to forward message. Please try again.");
    } finally {
      setForwarding(false);
    }
  };
  // Memoized filtered users and group chats
  const filteredUsers = useMemo(() => {
    const allUsers = users.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Make sure current user is included for self-forwarding
    const currentUserInList = allUsers.find(
      (user) => user.id === currentUserId
    );
    if (!currentUserInList) {
      // Add current user to the list if not already present
      const currentUserData = users.find((user) => user.id === currentUserId);
      if (currentUserData) {
        allUsers.unshift(currentUserData); // Add at the beginning
      }
    }

    return allUsers;
  }, [users, searchTerm, currentUserId]);
  const filteredGroupChats = useMemo(
    () =>
      groupChats.filter((chat) =>
        chat.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [groupChats, searchTerm]
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
            {filteredUsers.length > 0 || filteredGroupChats.length > 0 ? (
              <>
                {filteredGroupChats.length > 0 && (
                  <>
                    <div className="font-semibold text-sm text-gray-500">
                      Group Chats
                    </div>
                    {filteredGroupChats.map((chat) => (
                      <GroupChatListItem
                        key={chat.id}
                        chat={chat}
                        selected={selectedUsers.includes(chat.id)}
                        onSelect={handleUserSelect}
                      />
                    ))}
                  </>
                )}
                <div className="font-semibold text-sm text-gray-500">Users</div>
                {filteredUsers.map((user) => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    selected={selectedUsers.includes(user.id)}
                    onSelect={handleUserSelect}
                  />
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
                `Forward to ${selectedUsers.length}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
