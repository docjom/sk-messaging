import { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { formatTimestamp } from "../composables/scripts";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditProfile } from "@/components/EditProfile";
import { Contacts } from "@/components/Contacts";
import { CreateGroupChat } from "@/components/CreateGroupChat";
import ManageGroupChat from "../components/GroupChatSetting";
import { ChatListLoading } from "../components/ChatListLoading";
import { MessagesLoading } from "../components/MessagesLoading";
import { AddUsersToGroup } from "@/components/AddUserToGroup";
import { MessageList } from "@/components/MessageList";
import { ChatList } from "@/components/ChatList";
import { Logout } from "@/components/Logout";
import FileUploadDialog from "@/components/FileUploadDialog";
import ErrorProfileImage from "../assets/error.png";
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
  getDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

function Dashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
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

  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const handleFileUpload = async ({ file, message, chatId }) => {
    setIsUploadingFile(true);

    try {
      // Upload file to Firebase Storage
      const storage = getStorage();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `chat-files/${chatId}/${fileName}`);

      // Upload the file
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Send file message to chat
      const messagesRef = collection(db, "chats", chatId, "messages");
      const chatRef = doc(db, "chats", chatId);

      const messageData = {
        senderId: user.uid,
        message: message || "", // Optional text message
        timestamp: serverTimestamp(),
        seen: false,
        status: "sent",
        type: "file",
        fileData: {
          name: file.name,
          size: file.size,
          type: file.type,
          url: downloadURL,
          fileName: fileName,
        },
      };

      // Add the message
      await addDoc(messagesRef, messageData);

      // Update chat last message
      const lastMessageText = message ? message : `📎 ${file.name}`;
      await updateDoc(chatRef, {
        lastMessage: lastMessageText,
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

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (chatId, senderId, message) => {
    if (!message.trim()) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const chatRef = doc(db, "chats", chatId);

    try {
      const msgRef = await addDoc(messagesRef, {
        senderId,
        message,
        timestamp: serverTimestamp(),
        seen: false,
        status: "sending",
      });
      await updateDoc(msgRef, { status: "sent" });
      await updateDoc(chatRef, {
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
      });
    } catch (error) {
      toast.error("Error sending message:", error);
    }
  };

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
    const currentUserId = user?.uid;
    if (!currentUserId) {
      setUserProfile(null);
      return;
    }
    let unsubscribe;
    const setupListener = async () => {
      unsubscribe = await fetchUserProfile(currentUserId);
    };
    setupListener();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const fetchUserProfile = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const profileData = { id: userDoc.id, ...userDoc.data() };
          setUserProfile(profileData);
          //console.log("User profile updated:", profileData);
        } else {
          // console.log("No user profile found in Firestore");
          setUserProfile(null);
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!user) return;
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (querySnapshot) => {
        const usersList = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((u) => u.id !== user?.uid);
        setUsers(usersList);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserProfile(currentUser.uid);
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    if (user) {
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("users", "array-contains", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chatsArray = [];
        querySnapshot.forEach((doc) => {
          chatsArray.push({ id: doc.id, ...doc.data() });
        });
        setChats(chatsArray);
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
    if (!chatId || !messages.length) return;
    const batch = writeBatch(db);
    messages
      .filter((m) => m.senderId !== user.uid && !m.seen)
      .forEach((m) => {
        const msgRef = doc(db, "chats", chatId, "messages", m.id);
        batch.update(msgRef, { seen: true });
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
        [user.uid, selectedUserData.id],
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
          chatData.users.includes(user.uid) &&
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
      const otherUserId = chat.users.find((uid) => uid !== user.uid);
      const otherUser = users.find((u) => u.id === otherUserId);
      setSelectedUser(otherUser);
    } else {
      setSelectedUser(null);
    }
  };

  const handleSendMessage = async () => {
    if (!chatId) {
      console.error("Chat ID is not set.");
      return;
    }
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const users = chatData.users || [];
      if (!users.includes(user.uid)) {
        toast.error("You can't message in this group.");
        return;
      }
    }
    if (message.trim() !== "") {
      await sendMessage(chatId, user.uid, message);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
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
        const otherUserId = userIds.find((id) => id !== user.uid);
        const otherUser = users.find((u) => u.id === otherUserId);
        chatData.photoURL = otherUser?.photoURL || ErrorProfileImage;
      } else if (type === "group") {
        chatData.photoURL = "";
        chatData.admin = user.uid;
        chatData.userRoles = {};
        userIds.forEach((userId) => {
          chatData.userRoles[userId] = userId === user.uid ? "admin" : "member";
        });
      }
      const chatDoc = await addDoc(chatsRef, chatData);
      //console.log(`${type} chat created successfully with ID:`, chatDoc.id);
      return chatDoc.id;
    } catch (e) {
      // console.error("Error creating chat:", error);
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
      const allUsers = [...selectedUsers, user.uid];
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
    if (senderId === user?.uid) {
      return "";
    }
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
      const otherUserId = chat.users.find((uid) => uid !== user.uid);
      const otherUser = users.find((u) => u.id === otherUserId);
      return otherUser?.displayName || "Unknown User";
    }
    return chat.name;
  };
  const getChatPhoto = (chat) => {
    if (chat.type === "direct") {
      const otherUserId = chat.users.find((uid) => uid !== user.uid);
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
          if (!users.includes(user.uid)) {
            toast.error("You have been removed from this group.");
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
    const otherUserId = chat.users.find((uid) => uid !== user.uid);
    return getUserData(otherUserId);
  };
  return (
    <div className="h-screen flex flex-col lg:flex-row">
      <Toaster />
      {/* Menu */}
      {menu && (
        <div>
          {" "}
          <div className="w-64 bg-gray-800 text-white fixed top-0 left-0 z-50 overflow-y-auto p-4 flex flex-col h-full">
            <div className=" rounded mb-4 flex items-center gap-2 justify-start">
              <Avatar className="w-12 h-12">
                <AvatarImage src={displayUser?.photoURL} />
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
              <h1 className="text-lg font-semibold capitalize">
                {displayUser?.displayName}
              </h1>
            </div>
            <hr className="border border-gray-700 m-1" />
            <EditProfile currentUserId={displayUser.uid} />
            <CreateGroupChat
              users={users}
              currentUserId={user.uid}
              submitText="Create Group"
              isLoading={isCreatingGroup}
              onSubmit={createGroupChat}
            />
            <Contacts
              users={users}
              currentUserId={user?.uid}
              handleSelectUser={handleSelectUser}
            />
            {/* Logout Button */}
            <div className="absolute w-full bottom-0 left-0 p-2">
              <Logout />
            </div>
          </div>
          <div
            onClick={() => closeMenu()}
            className=" bg-gray-500/30 fixed top-0 left-0 z-40 w-screen h-screen backdrop-blur-sm"
          ></div>
        </div>
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
          <div className="space-y-2 mb-4 flex-1">
            <ChatList
              filteredChats={filteredChats}
              chatId={chatId}
              handleSelectChat={handleSelectChat}
              getOtherUserInDirectChat={getOtherUserInDirectChat}
              getChatPhoto={getChatPhoto}
              getChatDisplayName={getChatDisplayName}
              formatTimestamp={formatTimestamp}
            />
          </div>
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
            <ChatList
              filteredChats={filteredChats}
              chatId={chatId}
              handleSelectChat={handleSelectChat}
              getOtherUserInDirectChat={getOtherUserInDirectChat}
              getChatPhoto={getChatPhoto}
              getChatDisplayName={getChatDisplayName}
              formatTimestamp={formatTimestamp}
            />
          )}
        </div>
      )}

      {/* mobile end */}

      {/* Center Chat Area */}
      <div className="flex-1 bg-gray-100  sm:ml-64 lg:ml-0 sticky top-0 left-0 z-20 overflow-y-auto flex flex-col h-full">
        {/* Header */}
        {currentChat && (
          <div className="fixed top-0 left-0 right-0 bg-white shadow sm:ml-64 z-30">
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

                {/* back button */}
                {/* Show group members if it's a group chat */}
                {currentChat.type === "group" && (
                  <div className="flex justify-between items-center w-full">
                    <div className="flex justify-start gap-3 items-center w-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentChat.photoURL} />
                        <AvatarFallback>GP</AvatarFallback>
                      </Avatar>
                      <div className="text-gray-800 font-semibold text-sm sm:text-lg capitalize">
                        {getChatDisplayName(currentChat)}
                      </div>
                    </div>
                    {/* Add new user to group button */}
                    <div className="flex items-center gap-2">
                      <AddUsersToGroup
                        users={users}
                        currentUserId={user.uid}
                        currentChat={currentChat}
                        submitText="Add Members"
                        onSubmit={addUsersToGroup}
                        isLoading={isAddingUsers}
                      />
                      <div>
                        <ManageGroupChat
                          chatId={currentChat.id}
                          currentUserId={user.uid}
                          clearCurrentChat={clearChatId}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Show direct chat user info */}
                {currentChat.type === "direct" && selectedUser && (
                  <div className="flex items-center">
                    <img
                      src={selectedUser.photoURL}
                      alt={selectedUser.displayName}
                      className="w-10 h-10 rounded-full mr-2"
                      onError={(e) => {
                        e.target.src = ErrorProfileImage;
                      }}
                    />
                    <span className="text-lg text-gray-800 font-semibold capitalize">
                      {selectedUser.displayName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-white rounded shadow flex-1 pt-12 pb-12 flex flex-col">
          {chatId ? (
            <>
              {/* Messages Area with Loading */}
              {messagesLoading ? (
                <MessagesLoading />
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto h-96 p-4 bg-gray-50">
                    {messages.length > 0 ? (
                      <MessageList
                        messages={messages}
                        user={user}
                        getSenderData={getSenderData}
                        getSenderDisplayName={getSenderDisplayName}
                        formatTimestamp={formatTimestamp}
                      />
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
                  {/* <div ref={endOfMessagesRef} className="pb-10 bg-gray-50" /> */}
                </>
              )}

              {/* Message Input */}
              <div className="fixed bottom-0 left-0 right-0 bg-gray-50 shadow-lg sm:ml-64 z-30">
                <div className="px-4 py-2  border-t border-gray-300 ">
                  <div className="flex justify-center items-center gap-2">
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-blue-500 border"
                        onClick={() => setIsFileDialogOpen(true)}
                        disabled={!chatId || messagesLoading}
                      >
                        <Icon
                          icon="solar:file-send-bold"
                          width="24"
                          height="24"
                        />
                      </Button>
                    </div>
                    <input
                      type="text"
                      className="flex-1 p-2 outline-none rounded-l-lg "
                      value={message}
                      required
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Write a message..."
                      disabled={messagesLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      className={` p-2 rounded-full ${
                        !message.trim()
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-blue-500 text-white "
                      }`}
                      disabled={!message.trim()}
                    >
                      <Icon
                        icon="material-symbols:send-rounded"
                        width="30"
                        height="30"
                      />
                    </button>
                  </div>
                </div>
              </div>
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
    </div>
  );
}

export default Dashboard;
