import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { formatTimestamp } from "../composables/scripts";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditProfile } from "@/components/EditProfile";
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
  getDoc,
} from "firebase/firestore";
import { Icon } from "@iconify/react";
import { ChatListLoading } from "../components/ChatListLoading";
import { MessagesLoading } from "../components/MessagesLoading";
import MessageLogo3d from "../assets/message.svg";
import NoConversation from "../assets/NoConversation.png";
import ErrorProfileImage from "../assets/error.png";
import { Modal } from "../components/ModalMain";
import ManageGroupChat from "../components/GroupChatSetting";

const sendMessage = async (chatId, senderId, message) => {
  try {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const chatRef = doc(db, "chats", chatId);

    await addDoc(messagesRef, {
      senderId,
      message,
      timestamp: serverTimestamp(),
    });

    await updateDoc(chatRef, {
      lastMessage: message,
      lastMessageTime: serverTimestamp(),
    });
  } catch (error) {
    toast.error("Error sending message:", error);
  }
};

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
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chatName, setChatName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [menu, setMenu] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Loading states
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isAddingUsers, setIsAddingUsers] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Modal states
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [contactsModal, setContactsModal] = useState(false);
  const [addUserToGroupModal, setAddUserToGroupModal] = useState(false);

  const displayUser = userProfile || user;
  // Toggle menu visibility
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

  // Toggle create group modal visibility
  const toggleCreateGroupModal = () => {
    setCreateGroupModal(!createGroupModal);
  };
  const closeCreateGroupModal = () => {
    setCreateGroupModal(false);
  };

  // Toggle contacts modal visibility
  const toggleContactsModal = () => {
    setContactsModal(!contactsModal);
  };
  const closeContactsModal = () => {
    setContactsModal(false);
  };

  const toggleAddUserToGroupModal = () => {
    setAddUserToGroupModal(!addUserToGroupModal);
    setSelectedUsersToAdd([]);
  };
  const toggleUserSelectionForGroup = (userId) => {
    setSelectedUsersToAdd((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const addUsersToGroup = async () => {
    if (!currentChat || !currentChat.id || selectedUsersToAdd.length === 0)
      return;
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
          // Add new users with "member" role
          const updatedUserRoles = { ...currentUserRoles };
          newUsers.forEach((userId) => {
            updatedUserRoles[userId] = "member";
          });

          // Update the chat document with new users and roles
          await updateDoc(chatRef, {
            users: updatedUsers,
            userRoles: updatedUserRoles,
            updatedAt: serverTimestamp(),
          });

          // Update local state
          setCurrentChat((prev) => ({
            ...prev,
            users: updatedUsers,
            userRoles: updatedUserRoles,
          }));

          // Get user names for new users
          const usersRef = collection(db, "users");
          const newUsersNames = await Promise.all(
            newUsers.map(async (userId) => {
              const userDoc = await getDoc(doc(usersRef, userId));
              return userDoc.exists()
                ? userDoc.data().displayName
                : "Unknown User";
            })
          );

          // Send a system message about the new users
          const messagesRef = collection(
            db,
            "chats",
            currentChat.id,
            "messages"
          );
          for (let i = 0; i < newUsersNames.length; i++) {
            await addDoc(messagesRef, {
              senderId: user.uid,
              message: `${newUsersNames[i]} has been added to the group by ${displayUser.displayName}`,
              timestamp: serverTimestamp(),
              type: "system",
            });
          }

          toast(`${newUsers.length} user(s) added to the group successfully!`);
        } else {
          toast.info("Selected users are already in the group!");
        }
      }
    } catch (error) {
      console.error("Error adding users to group:", error);
      toast.error("Failed to add users to the group. Please try again.");
    } finally {
      setIsAddingUsers(false);
    }

    setAddUserToGroupModal(false);
    setSelectedUsersToAdd([]);
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

  // Fetch current user and user list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user profile from Firestore
        await fetchUserProfile(currentUser.uid);
        fetchUsers();
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // Fetch chats of the logged-in user
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

  // Fetch messages for the selected chat
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

  // Handle selecting a user for direct messaging
  const handleSelectUser = async (selectedUserData) => {
    setSelectedUser(selectedUserData);

    // Check if a direct chat already exists with this user
    const existingChat = await checkExistingDirectChat(selectedUserData.id);
    if (existingChat) {
      setChatId(existingChat.id);
      setCurrentChat(existingChat);
    } else {
      // Create a new direct chat
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
    setContactsModal(false);
    setCreateGroupModal(false);
    setMenu(false);
  };

  // Check if a direct chat already exists between the current user and selected user
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

  // Handle selecting a chat from the chat list
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

  // Handle sending message
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

  // Handle Enter key press for sending messages
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function to create a new chat (either direct or group)
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

      // Add profile picture logic
      if (type === "direct") {
        // For direct chats, use the other user's profile picture
        const otherUserId = userIds.find((id) => id !== user.uid);
        const otherUser = users.find((u) => u.id === otherUserId);
        chatData.photoURL = otherUser?.photoURL || ErrorProfileImage;
      } else if (type === "group") {
        // For group chats, use a default group image that can be changed later
        chatData.photoURL = ""; // Temp group image
        chatData.admin = user.uid;
        chatData.userRoles = {};

        userIds.forEach((userId) => {
          chatData.userRoles[userId] = userId === user.uid ? "admin" : "member";
        });
      }

      const chatDoc = await addDoc(chatsRef, chatData);
      console.log(`${type} chat created successfully with ID:`, chatDoc.id);
      return chatDoc.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to create chat. Please try again.");
      return null;
    }
  };

  // Handle logout
  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate("/");
    });
  };

  // Create a group chat
  const createGroupChat = async () => {
    setIsCreatingGroup(true);
    try {
      if (selectedUsers.length >= 1 && chatName.trim()) {
        const allUsers = [...selectedUsers, user.uid];
        const newChatId = await createChat("group", allUsers, chatName);
        if (newChatId) {
          console.log("Group chat created with ID:", newChatId);
          setChatId(newChatId);
          setChatName("");
          setSelectedUsers([]);
        }
      } else {
        toast(
          "Please select at least one user and provide a chat name for a group chat."
        );
      }
    } catch (error) {
      console.error("Error creating group chat:", error);
      toast("Failed to create group chat. Please try again.");
    } finally {
      setIsCreatingGroup(false);
    }
    setCreateGroupModal(false);
    setMenu(false);
  };

  // Toggle user selection for group chats
  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Get display name for sender
  const getSenderDisplayName = (senderId) => {
    if (senderId === user?.uid) {
      return "";
    }
    const sender = users.find((u) => u.id === senderId);
    return sender?.displayName || "Unknown User";
  };
  const getSenderData = (senderId) => {
    if (!senderId) return null;
    const sender = users.find((u) => u.id === senderId);
    return sender || null;
  };

  // Get chat display name
  const getChatDisplayName = (chat) => {
    if (chat.type === "direct") {
      const otherUserId = chat.users.find((uid) => uid !== user.uid);
      const otherUser = users.find((u) => u.id === otherUserId);
      return otherUser?.displayName || "Unknown User";
    }
    return chat.name;
  };
  // Get chat photo
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
            <div>
              <div
                onClick={toggleCreateGroupModal}
                className="flex items-center gap-4 cursor-pointer hover:bg-gray-700 p-2 rounded"
              >
                <div>
                  <Icon
                    icon="solar:users-group-rounded-linear"
                    width="24"
                    height="24"
                  />
                </div>
                <span className="font-semibold">New Group</span>
              </div>

              <div
                onClick={toggleContactsModal}
                className="flex items-center gap-4 cursor-pointer hover:bg-gray-700 p-2 rounded"
              >
                <div>
                  <Icon icon="solar:user-linear" width="24" height="24" />
                </div>
                <span className="font-semibold">Contacts</span>
              </div>
              {/* Logout Button */}
              <div className="absolute w-full bottom-0 left-0 p-2">
                <div
                  onClick={handleLogout}
                  className="gap-4 flex justify-center items-center cursor-pointer bg-red-500 p-2 rounded"
                >
                  <div>
                    <Icon icon="solar:logout-broken" width="24" height="24" />
                  </div>
                  <span className="font-semibold">Logout</span>
                </div>
              </div>
            </div>
          </div>
          <div
            onClick={() => closeMenu()}
            className=" bg-gray-500/30 fixed top-0 left-0 z-40 w-screen h-screen backdrop-blur-sm"
          ></div>
          {/* Create Group Modal */}
          <Modal
            isLoading={isCreatingGroup}
            isOpen={createGroupModal}
            onClose={closeCreateGroupModal}
            title="Create New Group"
            onSubmit={createGroupChat}
            isSubmitDisabled={
              selectedUsers.length === 0 || isCreatingGroup || !chatName.trim()
            }
            submitText={
              isCreatingGroup
                ? "Creating..."
                : `Create Group (${selectedUsers.length} selected)`
            }
          >
            <div>
              <input
                type="text"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="Group Chat Name"
                className="p-2 w-full rounded outline-none border border-gray-100 mb-2"
              />
              <div className="max-h-96 overflow-y-auto mb-2">
                {users
                  .filter((u) => u.id !== user?.uid)
                  .map((u) => (
                    <div
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      className={`cursor-pointer p-1 flex justify-start items-center gap-2 rounded text-sm capitalize ${
                        selectedUsers.includes(u.id)
                          ? "bg-blue-500"
                          : "hover:bg-gray-700"
                      }`}
                    >
                      <img
                        src={u?.photoURL}
                        alt="User Profile"
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          e.target.src = ErrorProfileImage;
                        }}
                      />
                      {u.displayName}
                    </div>
                  ))}
              </div>
            </div>
          </Modal>
          {/* Contacts Modal */}
          <Modal
            isOpen={contactsModal}
            onClose={closeContactsModal}
            title="Contacts"
          >
            <div className="max-h-96 overflow-y-auto mb-2">
              {users
                .filter((u) => u.id !== user?.uid)
                .map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className="cursor-pointer capitalize p-2 flex justify-start items-center gap-2 rounded hover:bg-gray-700 text-sm"
                  >
                    <img
                      src={u?.photoURL}
                      alt="User Profile"
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.target.src = ErrorProfileImage;
                      }}
                    />
                    {u.displayName}
                  </div>
                ))}
            </div>
          </Modal>
        </div>
      )}
      {/* Menu End */}

      {/* Add User to Group Modal */}
      <Modal
        isOpen={addUserToGroupModal}
        onClose={() => setAddUserToGroupModal(false)}
        isLoading={isAddingUsers}
        title="Add User to Group"
        onSubmit={addUsersToGroup}
        isSubmitDisabled={selectedUsersToAdd.length === 0 || isAddingUsers}
        submitText={
          isAddingUsers
            ? "Adding..."
            : `Add Users (${selectedUsersToAdd.length} selected)`
        }
      >
        <div className="max-h-96 overflow-y-auto mb-4">
          {users
            .filter(
              (u) => u.id !== user?.uid && !currentChat?.users?.includes(u.id)
            )
            .map((u) => (
              <div
                key={u.id}
                onClick={() => toggleUserSelectionForGroup(u.id)}
                className={`cursor-pointer capitalize p-2 flex justify-start items-center gap-2 rounded text-sm ${
                  selectedUsersToAdd.includes(u.id)
                    ? "bg-blue-500"
                    : "hover:bg-gray-700"
                }`}
              >
                <img
                  src={u?.photoURL}
                  alt="User Profile"
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.target.src = ErrorProfileImage;
                  }}
                />
                <div>
                  <div className="font-medium">{u.displayName}</div>
                  <div className="text-xs text-gray-400">{u.department}</div>
                </div>
              </div>
            ))}
          {users.filter(
            (u) => u.id !== user?.uid && !currentChat?.users?.includes(u.id)
          ).length === 0 && (
            <div className="text-center text-gray-400 py-4">
              No users available to add
            </div>
          )}
        </div>
      </Modal>

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
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`cursor-pointer p-2 rounded transition-colors ${
                  chatId === chat.id
                    ? "bg-blue-500/30 hover:bg-blue-500/40"
                    : "bg-gray-700/50 hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={getChatPhoto(chat)}
                    alt={getChatDisplayName(chat)}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      e.target.src = ErrorProfileImage;
                    }}
                  />

                  <div>
                    <div
                      className={`text-sm capitalize truncate max-w-40 ${
                        chatId === chat.id ? "font-semibold " : ""
                      }`}
                    >
                      {getChatDisplayName(chat)}
                    </div>
                    <div className="text-xs capitalize text-gray-400 flex items-center gap-1">
                      {chat.type}
                      {/* Show last message preview */}
                      {chat.lastMessage && (
                        <div
                          className={`text-xs  truncate w-20 ${
                            formatTimestamp(chat.lastMessageTime) === "Just now"
                              ? "font-bold text-white"
                              : "text-gray-300"
                          }`}
                        >
                          {chat.lastMessage}
                        </div>
                      )}
                      {/* Show timestamp */}
                      {chat.lastMessageTime && (
                        <div
                          className={`text-xs  max-w-20 truncate ${
                            formatTimestamp(chat.lastMessageTime) === "Just now"
                              ? "font-bold text-gray-200"
                              : "text-gray-400"
                          }`}
                        >
                          {formatTimestamp(chat.lastMessageTime)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
            <div className="space-y-2 mb-4 flex-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`cursor-pointer p-2 rounded transition-colors ${
                    chatId === chat.id
                      ? "bg-blue-500/30 hover:bg-blue-500/40"
                      : "bg-gray-700/50 hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      className="h-10 w-10"
                      alt={getChatDisplayName(chat)}
                    >
                      <AvatarImage src={getChatPhoto(chat)} />
                      <AvatarFallback>CI</AvatarFallback>
                    </Avatar>

                    <div>
                      <div
                        className={`text-sm capitalize truncate max-w-40 ${
                          chatId === chat.id ? "font-semibold " : ""
                        }`}
                      >
                        {getChatDisplayName(chat)}
                      </div>
                      <div className="text-xs capitalize text-gray-400 flex items-center gap-1">
                        {chat.type}
                        {/* Show last message preview */}
                        {chat.lastMessage && (
                          <div
                            className={`text-xs  truncate w-20 ${
                              formatTimestamp(chat.lastMessageTime) ===
                              "Just now"
                                ? "font-bold text-white"
                                : "text-gray-300"
                            }`}
                          >
                            {chat.lastMessage}
                          </div>
                        )}
                        {/* Show timestamp */}
                        {chat.lastMessageTime && (
                          <div
                            className={`text-xs  max-w-20 truncate ${
                              formatTimestamp(chat.lastMessageTime) ===
                              "Just now"
                                ? "font-bold text-gray-200"
                                : "text-gray-400"
                            }`}
                          >
                            {formatTimestamp(chat.lastMessageTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                      <div
                        onClick={toggleAddUserToGroupModal}
                        className="bg-gray-200/50 p-1 rounded-full"
                      >
                        {" "}
                        <Icon
                          icon="material-symbols:add-rounded"
                          width="24"
                          height="24"
                        />
                      </div>
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
                <div className="flex-1 overflow-y-auto h-96 p-4 bg-gray-50">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex mb-2 ${
                          msg.type === "system"
                            ? "justify-center"
                            : msg.senderId === user.uid
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div>
                          {" "}
                          <div className="flex items-end gap-1.5">
                            {msg.senderId !== user.uid &&
                              msg.type !== "system" && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={getSenderData(msg.senderId)?.photoURL}
                                  />
                                  <AvatarFallback>P</AvatarFallback>
                                </Avatar>
                              )}
                            <div
                              className={`relative max-w-md lg:max-w-lg ${
                                msg.type === "system"
                                  ? "bg-white/80 text-gray-600 text-center px-3 py-1.5 rounded-full shadow-sm text-xs"
                                  : msg.senderId === user.uid
                                  ? `bg-blue-500 text-white px-3 py-2 shadow-sm ${
                                      // Telegram-style rounded corners - more rounded on top-left, less on bottom-right
                                      "rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md"
                                    }`
                                  : `bg-white text-gray-800 px-3 py-2 shadow-sm border border-gray-100 ${
                                      // Opposite rounding for received messages
                                      "rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
                                    }`
                              }`}
                            >
                              {msg.type === "system" ? (
                                <p className="text-xs font-medium">
                                  {msg.message}
                                </p>
                              ) : (
                                <>
                                  {/* Header with sender info */}
                                  {msg.senderId !== user.uid && (
                                    <div className="flex gap-1.5 text-xs items-center mb-1">
                                      {getSenderDisplayName(msg.senderId) && (
                                        <p className="capitalize font-semibold text-blue-600">
                                          {getSenderDisplayName(msg.senderId)}
                                        </p>
                                      )}
                                      <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                                        {
                                          getSenderData(msg.senderId)
                                            ?.department
                                        }
                                      </span>
                                      <span className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                                        {getSenderData(msg.senderId)?.position}
                                      </span>
                                    </div>
                                  )}

                                  {/* For sent messages, show department/position differently */}
                                  {msg.senderId === user.uid && (
                                    <div className="flex gap-1.5 text-xs items-center mb-1 justify-end">
                                      <span className="text-[10px] bg-white/20 text-white rounded-full px-2 py-0.5 font-medium">
                                        {
                                          getSenderData(msg.senderId)
                                            ?.department
                                        }
                                      </span>
                                      <span className="text-[10px] bg-white/20 text-white rounded-full px-2 py-0.5 font-medium">
                                        {getSenderData(msg.senderId)?.position}
                                      </span>
                                    </div>
                                  )}

                                  {/* Message content */}
                                  <p className="text-sm leading-relaxed mb-1">
                                    {msg.message}
                                  </p>

                                  {/* Timestamp - Telegram style */}
                                  <div
                                    className={`flex items-center gap-1 ${
                                      msg.senderId === user.uid
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <p
                                      className={`text-[10px] ${
                                        msg.senderId === user.uid
                                          ? "text-white/70"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {formatTimestamp(msg.timestamp)}
                                    </p>
                                    {/* Read status indicators for sent messages (optional) */}
                                    {msg.senderId === user.uid && (
                                      <div className="flex">
                                        <svg
                                          className="w-3 h-3 text-white/70"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-800">
                      <div>
                        <div className="flex items-center justify-center">
                          <img
                            src={NoConversation}
                            alt="3d chat icon"
                            className="sm:size-30 size-20"
                          />
                        </div>
                        <h1 className="sm:text-2xl text-lg font-semibold">
                          No messages yet. Start the conversation!
                        </h1>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Message Input */}
              <div className="fixed bottom-0 left-0 right-0 bg-gray-50 shadow-lg sm:ml-64 z-30">
                <div className="px-4 py-2  border-t border-gray-300 ">
                  <div className="flex">
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
              <div>
                <div className="flex items-center justify-center">
                  <img
                    src={MessageLogo3d}
                    alt="3d chat icon"
                    className="sm:size-30 size-20"
                  />
                </div>
                <h1 className="sm:text-2xl text-lg font-semibold">
                  Select a chat to start messaging...
                </h1>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Center Chat Area End */}
    </div>
  );
}

export default Dashboard;
