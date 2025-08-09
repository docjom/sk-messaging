import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../firebase";
import { toast } from "sonner";
import ChatHeader from "@/components/chat/ChatHeader";
import { Toaster } from "@/components/ui/sonner";
import FileUploadDialog from "@/components/message/FileUploadDialog";
import ErrorProfileImage from "../assets/error.png";
import { UserInfo } from "@/components/user/UserInfo";
import { Menu } from "@/components/layout/Menu";
import Sidebar from "@/components/layout/Sidebar";
import MessageInputContainer from "@/components/message/MessageInputUi/MessageInputContainer";
import ChatContent from "@/components/chat/ChatContent";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  doc,
  updateDoc,
  onSnapshot,
  writeBatch,
  // limitToLast,
  // orderBy,
  arrayUnion,
  getDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { uploadBytes, getDownloadURL } from "firebase/storage";
import { useMessageActionStore } from "../stores/useMessageActionStore";
import { useUserStore } from "@/stores/useUserStore";
import { useTypingStatus } from "@/stores/useTypingStatus";
import { useInternetConnection } from "@/hooks/CheckInternetConnection";
import { useInfiniteMessages } from "@/hooks/useInfiniteMessages";
import { useMenu } from "@/hooks/useMenuState";
import { useChatFolderStore } from "@/stores/chat-folder/useChatFolderStore";
import { getRefs } from "@/utils/firestoreRefs";
import { NoInternetConnectionAlert } from "@/components/notification/AlertNoInternet";
import { clearChatId } from "@/hooks/useDashboard";
import { useMentions } from "@/stores/useUsersMentions";
import { useFolderStore } from "@/stores/chat-folder/useFolderStore";

function Dashboard() {
  const user = useUserStore((s) => s.userProfile);

  const { menu, setMenu } = useMenu();
  const endOfMessagesRef = useRef(null);

  const [isAddingUsers, setIsAddingUsers] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isMessagesSending, setIsMessagesSending] = useState(false);

  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [ifUserInfoOpen, setIfUserInfoOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const {
    chatId,
    setChatIdTo,
    clearChat,
    users,
    setUsers,
    setSelectedUser,
    setCurrentChat,
    currentChat,
    selectedUser,
    clearSelectedUser,
    topicId,
    clearEdit,
    clearReply,
    clearPastedImage,
    clearMessage,
  } = useMessageActionStore();
  const { clearMentionSuggestions } = useMentions();

  const cleanup = useTypingStatus((state) => state.cleanup);
  const { setFolderSidebar, folderSidebar } = useChatFolderStore();
  const { isOnline, wasOffline } = useInternetConnection();
  const { hasFolders } = useFolderStore();

  const { messages, messagesLoading, loadOlderMessages } =
    useInfiniteMessages(chatId);

  useEffect(() => {
    if (user?.uid) {
      useFolderStore.getState().checkUserHasFolders(user.uid);
    }
  }, [user]);

  useEffect(() => {
    if (!isOnline && wasOffline) {
      toast.error("Internet connection was interrupted!");
    }
  }, [isOnline, wasOffline]);
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  useEffect(() => {
    if (messages > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = messages;
  }, [messages]);

  const handleFileUpload = async ({ file, message, chatId }) => {
    setIsUploadingFile(true);
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const { chatRef, filesRef, messageCollectionRef } = getRefs({
        chatId,
        topicId,
      });
      const { storageRef } = getRefs({
        chatId,
        topicId,
        fileName,
      });

      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const messageData = {
        senderId: user?.uid,
        message: message || "",
        timestamp: serverTimestamp(),
        status: "sent",
        seenBy: [],
        type: "file",
        fileData: {
          name: file.name,
          size: file.size,
          type: file.type,
          url: downloadURL,
          fileName: fileName,
        },
      };
      await addDoc(messageCollectionRef, messageData);

      if (message && message.match(/(https?:\/\/[^\s]+)/g)) {
        const foundLinks = message.match(/(https?:\/\/[^\s]+)/g);
        for (const url of foundLinks) {
          await addDoc(filesRef, {
            senderId: user?.uid,
            type: "link",
            url,
            timestamp: serverTimestamp(),
          });
        }
      }
      if (fileName) {
        await addDoc(filesRef, {
          senderId: user?.uid,
          fileData: {
            name: file.name,
            size: file.size,
            type: file.type,
            url: downloadURL,
            fileName: fileName,
          },
          timestamp: serverTimestamp(),
        });
      }
      const lastMessageText = message ? message : `📎 ${file.name}`;
      if (chatRef) {
        await updateDoc(chatRef, {
          lastMessage: lastMessageText,
          seenBy: [],
          lastMessageTime: serverTimestamp(),
          lastSenderName: getSenderDisplayName(user?.uid),
        });
      }
      toast.success("File sent successfully!");
      setIsFileDialogOpen(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to send file. Please try again.");
    } finally {
      setIsUploadingFile(false);
    }
  };
  useEffect(() => {
    textareaRef.current?.focus();
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const toggleMenu = useCallback(() => {
    setMenu((prev) => !prev);
  }, [setMenu]);
  const closeMenu = () => {
    setMenu(false);
  };
  const handleSelectChat = (chat) => {
    clearReply();
    clearEdit();
    clearPastedImage();
    clearMentionSuggestions();
    clearMessage();
    setChatIdTo(chat.id);
    setCurrentChat(chat);
    if (chat.hasChatTopic) {
      setFolderSidebar(true);
    }
    if (chat.type === "direct") {
      const otherUserId = chat.users.find((uid) => uid !== user?.uid);
      const otherUser = users.find((u) => u.id === otherUserId);
      setSelectedUser(otherUser);
    } else {
      clearSelectedUser();
    }
  };
  const addUsersToGroup = async (selectedUsersToAdd) => {
    if (!currentChat || !currentChat.id || selectedUsersToAdd.length === 0) {
      toast.error("Please select users to add.");
      return;
    }
    setIsAddingUsers(true);
    try {
      const chatRef = doc(db, "chats", currentChat.id);
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const currentUsers = chatData.users || [];
        const currentUserRoles = chatData.userRoles || {};
        const newUsers = selectedUsersToAdd.filter(
          (userId) => !currentUsers.includes(userId)
        );
        if (newUsers.length > 0) {
          const updatedUsers = [...currentUsers, ...newUsers];
          const updatedUserRoles = { ...currentUserRoles };
          newUsers.forEach((userId) => {
            updatedUserRoles[userId] = "member";
          });
          await updateDoc(chatRef, {
            users: updatedUsers,
            userRoles: updatedUserRoles,
            updatedAt: serverTimestamp(),
          });
          const usersRef = collection(db, "users");
          const newUsersData = await Promise.all(
            newUsers.map(async (userId) => {
              const userDoc = await getDoc(doc(usersRef, userId));
              return {
                id: userId,
                name: userDoc.exists()
                  ? userDoc.data().displayName
                  : "Unknown User",
              };
            })
          );
          const messagesRef = collection(
            db,
            "chats",
            currentChat.id,
            "messages"
          );
          if (newUsersData.length === 1) {
            await addDoc(messagesRef, {
              senderId: "system",
              message: `${newUsersData[0].name} was added to the group by ${
                user?.displayName || "Admin"
              }`,
              timestamp: serverTimestamp(),
              type: "system",
            });
          } else {
            const userNames = newUsersData.map((u) => u.name).join(", ");
            await addDoc(messagesRef, {
              senderId: "system",
              message: `${userNames} were added to the group by ${
                user?.displayName || "Admin"
              }`,
              timestamp: serverTimestamp(),
              type: "system",
            });
          }
          toast.success(
            `${newUsers.length} user(s) added to the group successfully!`
          );
        } else {
          toast.info("Selected users are already in the group!");
        }
      } else {
        toast.error("Group not found!");
      }
    } catch (error) {
      console.error("Error adding users to group:", error);
      toast.error("Failed to add users to the group. Please try again.");
    } finally {
      setIsAddingUsers(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (querySnapshot) => {
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );
    return () => unsubscribe();
  }, [user, setUsers]);

  useEffect(() => {
    if (!chatId || !messages || !user?.uid) return;
    const updateSeenStatus = async () => {
      const batch = writeBatch(db);
      for (const m of messages.filter(
        (m) =>
          m.senderId !== user?.uid &&
          (!Array.isArray(m.seenBy) || !m.seenBy.includes(user?.uid))
      )) {
        const messageId = m?.id;
        const { messageRef } = getRefs({
          chatId,
          ...(topicId ? { topicId } : {}),
          messageId,
        });
        const msgSnap = await getDoc(messageRef);
        if (msgSnap.exists()) {
          batch.update(messageRef, {
            seenBy: arrayUnion(user?.uid),
            seen: true,
          });
        }
      }
      const { chatRef } = getRefs({
        chatId,
        ...(topicId ? { topicId } : {}),
      });
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        batch.update(chatRef, {
          seenBy: arrayUnion(user?.uid),
        });
      }
      await batch.commit();
    };
    updateSeenStatus();
  }, [chatId, messages, user?.uid, topicId]);

  const handleSelectUser = async (selectedUserData) => {
    setSelectedUser(selectedUserData);
    const existingChat = await checkExistingDirectChat(selectedUserData.id);
    if (existingChat) {
      setChatIdTo(existingChat.id);
      setCurrentChat(existingChat);
    } else {
      const newChatId = await createChat(
        "direct",
        [user?.uid, selectedUserData?.id],
        selectedUserData.displayName
      );
      if (newChatId) {
        const newChat = {
          id: newChatId,
          type: "direct",
          name: selectedUserData.displayName,
          users: [user?.uid, selectedUserData.id],
          photoURL: selectedUserData.photoURL || ErrorProfileImage,
          pin: [],
          createdAt: new Date(),
          lastMessage: null,
          lastMessageTime: null,
        };
        setChatIdTo(newChatId);
        setCurrentChat(newChat);
      }
    }
    setMenu(false);
  };
  // Create a group chat
  const createGroupChat = async (groupName, selectedUsers) => {
    setIsCreatingGroup(true);
    try {
      if (!groupName.trim()) {
        toast.error("Please provide a group name.");
        return;
      }
      if (selectedUsers.length === 0) {
        toast.error("Please select at least one user.");
        return;
      }
      const allUsers = [...selectedUsers, user?.uid];
      const newChatId = await createChat("group", allUsers, groupName.trim());
      if (newChatId) {
        console.log("Group chat created with ID:", newChatId);
        const newChat = {
          id: newChatId,
          type: "group",
          name: groupName.trim(),
          users: allUsers,
          photoURL: "",
          admin: user?.uid,
          userRoles: Object.fromEntries(
            allUsers.map((uid) => [uid, uid === user?.uid ? "admin" : "member"])
          ),
        };
        setChatIdTo(newChatId);
        setCurrentChat(newChat);
        setSelectedUser(newChat);
        toast.success(`Group "${groupName}" created successfully!`);
        setMenu(false);
      } else {
        throw new Error("Failed to create chat");
      }
    } catch (error) {
      console.error("Error creating group chat:", error);
      toast.error("Failed to create group chat. Please try again.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const checkExistingDirectChat = async (selectedUserId) => {
    try {
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("type", "==", "direct"));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const chatData = doc.data();
        if (
          chatData.users.includes(user?.uid) &&
          chatData.users.includes(selectedUserId)
        ) {
          return { id: doc.id, ...chatData };
        }
      }
      return null;
    } catch (error) {
      console.error("Error checking existing chat:", error);
      return null;
    }
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
        const otherUserId = userIds.find((id) => id !== user?.uid);
        const otherUser = users.find((u) => u.id === otherUserId);
        chatData.photoURL = otherUser?.photoURL;
      } else if (type === "group") {
        chatData.photoURL = "";
        chatData.admin = user?.uid;
        chatData.userRoles = {};
        userIds.forEach((userId) => {
          chatData.userRoles[userId] =
            userId === user?.uid ? "admin" : "member";
        });
      }
      const chatDoc = await addDoc(chatsRef, chatData);
      return chatDoc.id;
    } catch (e) {
      toast.error("Failed to create chat. Please try again.", e);
      return null;
    }
  };

  const getChatDisplayName = useCallback(
    (chat) => {
      if (chat.type === "direct") {
        const otherUserId = chat.users.find((uid) => uid !== user?.uid);
        const otherUser = users.find((u) => u.id === otherUserId);
        return otherUser?.displayName || "Unknown User";
      }
      return chat.name;
    },
    [user, users]
  );

  const getSenderDisplayName = (senderId) => {
    const sender = users.find((u) => u.id === senderId);
    return sender?.displayName || "Unknown User";
  };

  const getSenderData = (senderId) => {
    if (!senderId) return null;
    const sender = users.find((u) => u.id === senderId);
    return sender || null;
  };
  useEffect(() => {
    if (!chatId || !user?.uid) return;
    const chatRef = doc(db, "chats", chatId);
    const unsubscribe = onSnapshot(
      chatRef,
      async (docSnap) => {
        if (!docSnap.exists()) {
          toast.error("This chat no longer exists.");
          clearChat();
          return;
        }
        const chatData = docSnap.data();
        const users = chatData.users || [];
        if (!users.includes(user.uid)) {
          toast.error("This chat no longer exists.");
          clearChat();
          return;
        }
      },
      (error) => {
        console.error("Error listening to chat:", error);
        toast.error("Connection error. Please refresh.");
      }
    );
    return () => unsubscribe();
  }, [chatId, user?.uid, clearChat]);

  return (
    <div className="h-screen  flex flex-col lg:flex-row">
      {!isOnline && wasOffline && (
        <div className="top-0 absolute w-full z-50">
          <div className="flex justify-center items-center m-2">
            <NoInternetConnectionAlert />
          </div>
        </div>
      )}
      {/* Toast Notifications */}
      <Toaster />

      {/* Menu */}
      {menu && (
        <Menu
          users={users}
          isCreatingGroup={isCreatingGroup}
          createGroupChat={createGroupChat}
          user={user}
          displayUser={user}
          handleSelectUser={handleSelectUser}
          closeMenu={closeMenu}
        />
      )}
      {/* Sidebar */}
      <Sidebar
        toggleMenu={toggleMenu}
        handleSelectChat={handleSelectChat}
        getSenderDisplayName={getSenderDisplayName}
      />
      {/* Center Chat Area */}
      <div
        className={`flex-1 bg-gray-white   lg:ml-0 sticky top-0 left-0 z-20 overflow-y-hidden flex flex-col h-full 
        ${hasFolders && !folderSidebar ? "sm:ml-74" : "sm:ml-64"}`}
      >
        {/* Header */}
        {chatId && (
          <ChatHeader
            currentChat={currentChat}
            selectedUser={selectedUser}
            user={user}
            users={users}
            chatId={chatId}
            getChatDisplayName={getChatDisplayName}
            getSenderDisplayName={getSenderDisplayName}
            clearChatId={clearChatId}
            setIfUserInfoOpen={setIfUserInfoOpen}
            addUsersToGroup={addUsersToGroup}
            isAddingUsers={isAddingUsers}
          />
        )}

        {/* Chat Content */}
        <ChatContent
          chatId={chatId}
          messages={messages}
          messagesLoading={messagesLoading}
          loadOlderMessages={loadOlderMessages}
          user={user}
          userProfile={user}
          getSenderData={getSenderData}
          getSenderDisplayName={getSenderDisplayName}
        />
        {/* Message Input */}
        {chatId && (
          <MessageInputContainer
            chatId={chatId}
            user={user}
            users={users}
            messagesLoading={messagesLoading}
            isMessagesSending={isMessagesSending}
            setIsMessagesSending={setIsMessagesSending}
            setIsFileDialogOpen={setIsFileDialogOpen}
            getSenderDisplayName={getSenderDisplayName}
          />
        )}
      </div>
      {/* Dialogs */}
      <FileUploadDialog
        isOpen={isFileDialogOpen}
        onClose={() => setIsFileDialogOpen(false)}
        onSend={handleFileUpload}
        chatId={chatId}
        isLoading={isUploadingFile}
      />
      <UserInfo
        isOpen={ifUserInfoOpen}
        onClose={() => setIfUserInfoOpen(false)}
        user={selectedUser}
      />
    </div>
  );
}

export default Dashboard;
