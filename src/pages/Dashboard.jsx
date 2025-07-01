import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { formatTimestamp } from "../composables/scripts";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ManageGroupChat from "../components/GroupChatSetting";
import { ChatListLoading } from "../components/ChatListLoading";
import { MessagesLoading } from "../components/MessagesLoading";
import { AddUsersToGroup } from "@/components/AddUserToGroup";
import { MessageList } from "@/components/MessageList";
import { ChatList } from "@/components/ChatList";
import FileUploadDialog from "@/components/FileUploadDialog";
import ErrorProfileImage from "../assets/error.png";
import { UserInfo } from "@/components/UserInfo";
import { Menu } from "@/components/Menu";
import { PinnedMessages } from "@/components/PinnedMessages";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  where,
  writeBatch,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useMessageActionStore } from "../stores/useMessageActionStore";
import { MessageInput } from "@/components/MessageInput";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChatFiles } from "@/components/ChatFiles";
import { useUserStore } from "@/stores/useUserStore";

function Dashboard() {
  const user = useUserStore((s) => s.user);
  const userProfile = useUserStore((s) => s.userProfile);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [chatId, setChatId] = useState("");
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [menu, setMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const endOfMessagesRef = useRef(null);

  // Loading states
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isAddingUsers, setIsAddingUsers] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isMessagesSending, setIsMessagesSending] = useState(false);

  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [ifUserInfoOpen, setIfUserInfoOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const { replyTo, clearReply, editMessage, clearEdit } =
    useMessageActionStore();

  const uploadImageToStorage = async (imageFile, chatId) => {
    const storage = getStorage();
    const timestamp = Date.now();
    const imageRef = ref(
      storage,
      `chat-files/${chatId}/${timestamp}_${imageFile?.name}`
    );
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const sendMessage = async (
    chatId,
    senderId,
    message,
    reply,
    edit,
    pastedImage
  ) => {
    if (!message.trim() && !pastedImage) return;
    setIsMessagesSending(true);
    const tempMessageId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempMessageId,
      senderId,
      message,
      status: "sending",
      isTemporary: true,
      ...(pastedImage && {
        type: "file",
        fileData: {
          name: pastedImage.name,
          type: pastedImage.type,
          url: pastedImage.preview,
          uploading: true,
        },
      }),
    };

    setMessages((prev) => [...prev, tempMessage]);
    try {
      let imageURL = null;
      if (pastedImage) {
        imageURL = await uploadImageToStorage(pastedImage.file, chatId);
      }
      if (edit?.messageId) {
        const msgRef = doc(db, "chats", chatId, "messages", edit.messageId);
        const updateData = {
          message: message,
          edited: true,
          timestamp: edit?.timestamp,
          editTimestamp: serverTimestamp(),
        };
        await updateDoc(msgRef, updateData);
        useMessageActionStore.getState().clearEdit();
      } else {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const chatRef = doc(db, "chats", chatId);
        const messagePayload = {
          senderId,
          message,
          seenBy: [],
          timestamp: serverTimestamp(),
          status: "sending",
          ...(reply?.messageId && {
            replyTo: {
              messageId: reply.messageId,
              senderId: reply.senderId || null,
              message: reply.message || null,
              senderName: reply.name || null,
              ...(reply.fileData && { fileData: reply.fileData }),
            },
          }),
          ...(imageURL && {
            type: "file",
            fileData: {
              fileName: pastedImage?.name,
              url: imageURL,
              name: pastedImage?.name,
              type: pastedImage?.type,
              size: pastedImage?.file.size,
            },
          }),
        };
        const msgRef = await addDoc(messagesRef, messagePayload);
        await updateDoc(msgRef, { status: "sent" });
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
        const lastMessageText = message.trim()
          ? message.trim()
          : imageURL
          ? `📎 ${pastedImage.name}`
          : "";
        await updateDoc(chatRef, {
          seenBy: [],
          lastMessage: lastMessageText,
          lastMessageTime: serverTimestamp(),
        });
        useMessageActionStore.getState().clearReply();
      }
      textareaRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error sending message:", error);
    } finally {
      setIsMessagesSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatId) {
      console.error("Chat ID is not set.");
      return;
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current?.focus();
    }
    const pastedImage = useMessageActionStore.getState().pastedImage;
    const msgToSend = message.trim();
    const reply = useMessageActionStore.getState().replyTo;
    const edit = useMessageActionStore.getState().editMessage;

    if (msgToSend === "" && !pastedImage) return;

    clearReply();
    clearEdit();
    setMessage("");

    // Fixed: Clear from the correct store
    if (pastedImage) {
      useMessageActionStore.getState().clearPastedImage();
    }
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const users = chatData.users || [];
      if (!users.includes(user?.uid)) {
        toast.error("You can't message in this group.");
        return;
      }
    }
    await sendMessage(chatId, user?.uid, msgToSend, reply, edit, pastedImage);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if ((replyTo || editMessage) && textareaRef.current) {
      if (editMessage) {
        setMessage(editMessage.message);
      }
      textareaRef.current.focus();
    }
  }, [replyTo, editMessage]);
  useEffect(() => {
    if (textareaRef.current && message.trim() === "") {
      textareaRef.current.focus();
    }
  }, [message]);

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  const handleFileUpload = async ({ file, message, chatId }) => {
    setIsUploadingFile(true);
    try {
      const storage = getStorage();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `chat-files/${chatId}/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      const messagesRef = collection(db, "chats", chatId, "messages");
      const chatRef = doc(db, "chats", chatId);
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
      await addDoc(messagesRef, messageData);
      const lastMessageText = message ? message : `📎 ${file.name}`;
      await updateDoc(chatRef, {
        lastMessage: lastMessageText,
        seenBy: [],
        lastMessageTime: serverTimestamp(),
      });
      toast.success("File sent successfully!");
      setIsFileDialogOpen(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to send file. Please try again.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleCancelEdit = () => {
    clearEdit();
    clearReply();
    setMessage("");
    textareaRef.current?.focus();
  };
  useEffect(() => {
    textareaRef.current?.focus();
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const displayUser = userProfile || user;
  const toggleMenu = () => {
    setMenu(true);
  };
  const closeMenu = () => {
    setMenu(false);
  };
  const clearChatId = () => {
    setChatId("");
    setCurrentChat("");
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
          setCurrentChat((prev) => ({
            ...prev,
            users: updatedUsers,
            userRoles: updatedUserRoles,
          }));
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
                userProfile?.displayName || "Admin"
              }`,
              timestamp: serverTimestamp(),
              type: "system",
            });
          } else {
            const userNames = newUsersData.map((u) => u.name).join(", ");
            await addDoc(messagesRef, {
              senderId: "system",
              message: `${userNames} were added to the group by ${
                userProfile?.displayName || "Admin"
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
        //  .filter((u) => u.id !== user?.uid);
        setUsers(usersList);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (user) {
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("users", "array-contains", user?.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chatsArray = [];
        querySnapshot.forEach((doc) => {
          chatsArray.push({ id: doc.id, ...doc.data() });
        });
        const sortedChats = chatsArray.sort((a, b) => {
          const aTime = a.lastMessageTime?.toMillis?.() || 0;
          const bTime = b.lastMessageTime?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setChats(sortedChats);
        setChatsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (chatId) {
      setMessagesLoading(true);
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(messagesRef, orderBy("timestamp"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesArray = [];
        querySnapshot.forEach((doc) => {
          messagesArray.push({ id: doc.id, ...doc.data() });
        });
        setMessages(messagesArray);
        setMessagesLoading(false);
      });
      return () => unsubscribe();
    } else {
      setMessages([]);
      setMessagesLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !messages.length || !user?.uid) return;
    const batch = writeBatch(db);
    messages
      .filter(
        (m) =>
          m.senderId !== user?.uid &&
          (!Array.isArray(m.seenBy) || !m.seenBy.includes(user.uid))
      )
      .forEach((m) => {
        const msgRef = doc(db, "chats", chatId, "messages", m.id);
        batch.update(msgRef, {
          seenBy: arrayUnion(user.uid),
          seen: true,
        });
      });
    const chatRef = doc(db, "chats", chatId);
    updateDoc(chatRef, {
      seenBy: arrayUnion(user.uid),
    });

    batch.commit();
  }, [chatId, messages, user?.uid]);

  const handleSelectUser = async (selectedUserData) => {
    setSelectedUser(selectedUserData);
    const existingChat = await checkExistingDirectChat(selectedUserData.id);
    if (existingChat) {
      setChatId(existingChat.id);
      setCurrentChat(existingChat);
    } else {
      const newChatId = await createChat(
        "direct",
        [user?.uid, selectedUserData.id],
        selectedUserData.displayName
      );
      if (newChatId) {
        setChatId(newChatId);
        const newChat = chats.find((chat) => chat.id === newChatId);
        setCurrentChat(newChat);
      }
    }
    setMenu(false);
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

  const handleSelectChat = (chat) => {
    setChatId(chat.id);
    setCurrentChat(chat);
    if (chat.type === "direct") {
      const otherUserId = chat.users.find((uid) => uid !== user?.uid);
      const otherUser = users.find((u) => u.id === otherUserId);
      setSelectedUser(otherUser);
    } else {
      setSelectedUser(null);
    }
  };

  const handleKeyPress = (e) => {
    textareaRef.current?.focus();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const createChat = async (type, userIds, name = "") => {
    try {
      const chatsRef = collection(db, "chats");
      const chatData = {
        type,
        name: name || (type === "direct" ? "Direct Chat" : "Group Chat"),
        users: userIds,
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: null,
      };
      if (type === "direct") {
        const otherUserId = userIds.find((id) => id !== user?.uid);
        const otherUser = users.find((u) => u.id === otherUserId);
        chatData.photoURL = otherUser?.photoURL || ErrorProfileImage;
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
        setChatId(newChatId);
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

  const getSenderDisplayName = (senderId) => {
    const sender = users.find((u) => u.id === senderId);
    return sender?.displayName || "Unknown User";
  };
  const getUserData = (userId) => {
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
    return user || null;
  };
  const getSenderData = (senderId) => {
    if (!senderId) return null;
    const sender = users.find((u) => u.id === senderId);
    return sender || null;
  };
  const getChatDisplayName = (chat) => {
    if (chat.type === "direct") {
      const otherUserId = chat.users.find((uid) => uid !== user?.uid);
      const otherUser = users.find((u) => u.id === otherUserId);
      return otherUser?.displayName || "Unknown User";
    }
    return chat.name;
  };
  const getChatPhoto = (chat) => {
    if (chat.type === "direct") {
      const otherUserId = chat.users.find((uid) => uid !== user?.uid);
      const otherUser = users.find((u) => u.id === otherUserId);
      return otherUser?.photoURL || ErrorProfileImage;
    }
    return chat.photoURL || ErrorProfileImage;
  };
  const filteredChats = chats.filter((chat) => {
    const name = getChatDisplayName(chat).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });
  useEffect(() => {
    if (!chatId || !user?.uid) return;
    const chatRef = doc(db, "chats", chatId);
    const unsubscribe = onSnapshot(
      chatRef,
      (doc) => {
        if (doc.exists()) {
          const chatData = doc.data();
          const users = chatData.users || [];
          if (!users.includes(user?.uid)) {
            toast.error("This chat no longer exists.");
            clearChatId();
          }
        } else {
          toast.error("This chat no longer exists.");
          clearChatId();
        }
      },
      (error) => {
        console.error("Error listening to chat:", error);
        toast.error("Connection error. Please refresh.");
      }
    );
    return () => unsubscribe();
  }, [chatId, user?.uid]);
  const getOtherUserInDirectChat = (chat) => {
    if (chat.type !== "direct") return null;
    const otherUserId = chat.users.find((uid) => uid !== user?.uid);
    return getUserData(otherUserId);
  };
  return (
    <div className="h-screen flex flex-col lg:flex-row">
      <Toaster />
      {/* Menu */}
      {menu && (
        <Menu
          users={users}
          isCreatingGroup={isCreatingGroup}
          createGroupChat={createGroupChat}
          user={user}
          displayUser={displayUser}
          handleSelectUser={handleSelectUser}
          closeMenu={closeMenu}
        />
      )}
      {/* Menu End */}

      {/* Left Panel (Sidebar) */}
      <div className="w-64 bg-gray-800 text-white fixed lg:sticky top-0 left-0 z-10 overflow-y-auto p-2 flex flex-col h-full">
        <div className="flex items-center justify-start gap-2 mb-4">
          <div
            onClick={() => toggleMenu()}
            className="rounded-full bg-gray-700/50 p-2"
          >
            <Icon icon="duo-icons:menu" width="24" height="24" />
          </div>
          <div className="w-full">
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-full border border-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {/* Chat List with Loading */}
        {chatsLoading ? (
          <ChatListLoading />
        ) : (
          <>
            {filteredChats.length > 0 ? (
              <ChatList
                filteredChats={filteredChats}
                chatId={chatId}
                handleSelectChat={handleSelectChat}
                getOtherUserInDirectChat={getOtherUserInDirectChat}
                getChatPhoto={getChatPhoto}
                getChatDisplayName={getChatDisplayName}
                formatTimestamp={formatTimestamp}
                currentUserId={user?.uid}
                onLeaveSuccess={clearChatId}
              />
            ) : (
              <div className=" mx-1 p-2 border-gray-600/50 rounded-lg border text-gray-500">
                No Recent Chats
              </div>
            )}
          </>
        )}
      </div>
      {/* Left Panel (Sidebar) End */}

      {/* mobile */}
      {!chatId && (
        <div className="w-screen bg-gray-800 sm:hidden text-white fixed lg:sticky top-0 left-0 z-30 overflow-y-auto p-2 flex flex-col h-full">
          <div className="flex items-center justify-start gap-2 mb-4">
            <div
              onClick={() => toggleMenu()}
              className="rounded-full bg-gray-700/50 p-2"
            >
              <Icon icon="duo-icons:menu" width="24" height="24" />
            </div>
            <div className="w-full">
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-full border border-gray-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* Chat List with Loading */}
          {chatsLoading ? (
            <ChatListLoading />
          ) : (
            <>
              {filteredChats.length > 0 ? (
                <ChatList
                  filteredChats={filteredChats}
                  chatId={chatId}
                  handleSelectChat={handleSelectChat}
                  getOtherUserInDirectChat={getOtherUserInDirectChat}
                  getChatPhoto={getChatPhoto}
                  getChatDisplayName={getChatDisplayName}
                  formatTimestamp={formatTimestamp}
                  currentUserId={user?.uid}
                  onLeaveSuccess={clearChatId}
                />
              ) : (
                <div className=" mx-1 p-2 border-gray-600/50 rounded-lg border text-gray-500">
                  No Recent Chats
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* mobile end */}

      {/* Center Chat Area */}
      <div className="flex-1 bg-gray-white  sm:ml-64 lg:ml-0 sticky top-0 left-0 z-20 overflow-y-hidden flex flex-col h-full">
        {/* Header */}
        {currentChat && (
          <div className="fixed top-0 left-0 right-0 bg-white  sm:ml-64 z-30">
            <div className="bg-white px-4 py-2 rounded shadow w-full flex items-center">
              <div className="w-full flex justify-start items-center  gap-2">
                {/* Back button */}
                <div
                  onClick={clearChatId}
                  className="rounded-full sm:hidden bg-gray-200/50 p-2 text-gray-800 shadow"
                >
                  <Icon
                    icon="solar:rewind-back-bold-duotone"
                    width="24"
                    height="24"
                  />
                </div>
                {/* Show group members if it's a group chat */}
                {currentChat.type === "group" && (
                  <div className="flex justify-between items-center w-full">
                    <div className="flex justify-start gap-3 items-center w-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentChat.photoURL} />
                        <AvatarFallback>GP</AvatarFallback>
                      </Avatar>
                      <div className="text-gray-800 font-semibold text-sm sm:max-w-52 max-w-20 truncate sm:text-lg capitalize">
                        {getChatDisplayName(currentChat)}
                      </div>
                    </div>
                    {/* Add new user to group button */}
                    <div className="flex items-center gap-2">
                      <AddUsersToGroup
                        users={users}
                        currentUserId={user?.uid}
                        currentChat={currentChat}
                        submitText="Add Members"
                        onSubmit={addUsersToGroup}
                        isLoading={isAddingUsers}
                      />
                      <div>
                        <ManageGroupChat
                          chatId={currentChat.id}
                          currentUserId={user?.uid}
                          clearCurrentChat={clearChatId}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Show direct chat user info */}
                {currentChat.type === "direct" && selectedUser && (
                  <div className="flex justify-between items-center w-full">
                    {" "}
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex items-center p-0"
                      onClick={() => setIfUserInfoOpen(true)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={selectedUser.photoURL}
                          alt={selectedUser.displayName}
                        />
                        <AvatarFallback>P</AvatarFallback>
                      </Avatar>
                      <span className="text-lg text-gray-800 sm:max-w-52 max-w-40 truncate font-semibold capitalize">
                        {selectedUser.displayName}
                      </span>
                    </Button>
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 transition">
                            <Icon
                              icon="solar:hamburger-menu-broken"
                              width="20"
                              height="20"
                            />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <div className="grid grid-cols-1">
                            <Button
                              onClick={() => setIfUserInfoOpen(true)}
                              variant={"ghost"}
                              className=" flex justify-start"
                            >
                              {" "}
                              <Icon
                                icon="hugeicons:profile-02"
                                width="20"
                                height="20"
                              />
                              View Profile
                            </Button>
                            <PinnedMessages chatId={chatId} />
                            <ChatFiles chatId={chatId} />

                            {/* <DeleteUserChat
                              chatId={chatId}
                              currentUserId={user?.uid}
                              clearCurrentChat={clearChatId}
                            /> */}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {/* {getChatDisplayName(currentChat) === "Unknown User" && (
                  <div className="flex justify-between items-center w-full">
                    <div className="font-semibold text-gray-600 py-1.5">
                      Unknown User
                    </div>
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 transition">
                            <Icon
                              icon="solar:hamburger-menu-broken"
                              width="20"
                              height="20"
                            />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <DeleteUserChat
                            chatId={chatId}
                            currentUserId={user?.uid}
                            clearCurrentChat={clearChatId}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-white rounded overflow-y-auto flex-1 mt-13 mb-14 flex flex-col justify-end">
          {chatId ? (
            <>
              {/* Messages Area with Loading */}
              {messagesLoading ? (
                <MessagesLoading />
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto h-full py-4 px-2 bg-gray-50 ">
                    {messages.length > 0 ? (
                      <>
                        <MessageList
                          messages={messages}
                          user={userProfile}
                          chatId={chatId}
                          users={users}
                          getSenderData={getSenderData}
                          getSenderDisplayName={getSenderDisplayName}
                          formatTimestamp={formatTimestamp}
                          currentUserId={user?.uid}
                        />
                        <div ref={messagesEndRef} />
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-800">
                        <div className="border rounded-full px-4 py-1">
                          <h1 className=" text-sm font-semibold">
                            No messages yet. Start the conversation!
                          </h1>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Message Input */}
              <MessageInput
                chatId={chatId}
                messagesLoading={messagesLoading}
                isMessagesSending={isMessagesSending}
                setIsFileDialogOpen={setIsFileDialogOpen}
                handleKeyPress={handleKeyPress}
                handleSendMessage={handleSendMessage}
                handleCancelEdit={handleCancelEdit}
                message={message}
                textareaRef={textareaRef}
                replyTo={replyTo}
                editMessage={editMessage}
                setMessage={setMessage}
              />
            </>
          ) : (
            <div className="hidden sm:flex items-center justify-center h-full text-gray-800 ">
              <div className="flex items-center justify-center h-full text-gray-800">
                <div className="border rounded-full px-4 py-1">
                  <h1 className=" text-sm font-semibold">
                    Select a chat to start messaging!
                  </h1>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Center Chat Area End */}
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
