import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { formatTimestamp } from "../composables/scripts";
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
import { Modal } from "../components/ModalMain";

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
    console.error("Error sending message:", error);
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null); // Firebase Auth user
  const [userProfile, setUserProfile] = useState(null); // Firestore user profile
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
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [contactsModal, setContactsModal] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [addUserToGroupModal, setAddUserToGroupModal] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);

  // Profile editing states
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDepartment, setDepartment] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPosition, setEditPosition] = useState("");

  // Toggle menu visibility
  const toggleMenu = () => {
    setMenu(true);
  };
  const closeMenu = () => {
    setMenu(false);
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

    try {
      const chatRef = doc(db, "chats", currentChat.id);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const currentUsers = chatData.users || [];
        const newUsers = selectedUsersToAdd.filter(
          (userId) => !currentUsers.includes(userId)
        );

        if (newUsers.length > 0) {
          const updatedUsers = [...currentUsers, ...newUsers];
          await updateDoc(chatRef, {
            users: updatedUsers,
            updatedAt: serverTimestamp(),
          });

          // Update local state
          setCurrentChat((prev) => ({
            ...prev,
            users: updatedUsers,
          }));

          alert(`${newUsers.length} user(s) added to group successfully!`);
        } else {
          alert("Selected users are already in the group!");
        }
      }
    } catch (error) {
      console.error("Error adding users to group:", error);
      alert("Failed to add users to group. Please try again.");
    }

    setAddUserToGroupModal(false);
    setSelectedUsersToAdd([]);
  };

  // Toggle edit profile modal visibility
  const toggleEditProfileModal = () => {
    setEditProfileModal(!editProfileModal);
    if (!editProfileModal && userProfile) {
      // Pre-fill the form with current profile data
      setEditDisplayName(userProfile.displayName || "");
      setDepartment(userProfile.department || "");
      setEditPhone(userProfile.phone || "");
      setEditPosition(userProfile.position || "");
    }
  };
  const closeEditProfileModal = () => {
    setEditProfileModal(false);
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const profileData = { id: userDoc.id, ...userDoc.data() };
        setUserProfile(profileData);
        return profileData;
      } else {
        console.log("No user profile found in Firestore");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Update user profile in Firestore
  const updateUserProfile = async () => {
    if (!user?.uid) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: editDisplayName,
        department: editDepartment,
        phone: editPhone,
        position: editPosition,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setUserProfile((prev) => ({
        ...prev,
        displayName: editDisplayName,
        department: editDepartment,
        position: editPosition,
        phone: editPhone,
      }));

      alert("Profile updated successfully!");
      setEditProfileModal(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
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
      const chatDoc = await addDoc(chatsRef, {
        type,
        name: name || (type === "direct" ? "Direct Chat" : "Group Chat"),
        users: userIds,
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: null,
      });
      console.log(`${type} chat created successfully with ID:`, chatDoc.id);
      return chatDoc.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to create chat. Please try again.");
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
      alert(
        "Please select at least one user and provide a chat name for a group chat."
      );
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

  // Use userProfile data if available, fallback to Firebase Auth user
  const displayUser = userProfile || user;

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Menu */}
      {menu && (
        <div>
          {" "}
          <div className="w-64 bg-gray-800 text-white fixed top-0 left-0 z-50 overflow-y-auto p-4 flex flex-col h-full">
            <div className=" rounded mb-4 flex items-center gap-2 justify-start">
              <img
                src={displayUser?.photoURL}
                alt="User Profile"
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
              <h1 className="text-lg font-semibold capitalize">
                {displayUser?.displayName}
              </h1>
            </div>
            <hr className="border border-gray-700 m-1" />
            <div
              onClick={toggleEditProfileModal}
              className="flex items-center gap-4 cursor-pointer hover:bg-gray-700 p-2 rounded"
            >
              <div>
                <Icon icon="iconoir:profile-circle" width="24" height="24" />
              </div>
              <span className="font-semibold">My Profile</span>
            </div>
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
          {/* Edit Profile Modal */}
          {editProfileModal && (
            <div className="bg-gray-500/30 fixed top-0 left-0 z-50 w-screen h-screen text-white">
              <div className="flex h-screen justify-center items-center">
                <div className="p-4 border rounded-lg bg-gray-800 max-w-md w-full">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h1 className="font-semibold text-lg">Edit Profile</h1>
                      <div
                        onClick={closeEditProfileModal}
                        className="cursor-pointer"
                      >
                        <Icon
                          icon="solar:close-square-bold"
                          width="24"
                          height="24"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-center mb-4">
                        <img
                          src={displayUser?.photoURL}
                          alt="Profile"
                          className="w-20 h-20 rounded-full"
                          onError={(e) => {
                            e.target.src = "/default-avatar.png";
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          className="p-2 w-full rounded outline-none border border-gray-600 bg-gray-700 text-white"
                          placeholder="Enter display name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          value={editDepartment}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="p-2 w-full rounded outline-none border border-gray-600 bg-gray-700 text-white"
                          placeholder="Enter department"
                        />
                      </div>

                      <div className="flex  gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="p-2 w-full rounded outline-none border border-gray-600 bg-gray-700 text-white"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Position
                          </label>
                          <input
                            type="text"
                            value={editPosition}
                            onChange={(e) => setEditPosition(e.target.value)}
                            className="p-2 w-full rounded outline-none border border-gray-600 bg-gray-700 text-white"
                            placeholder="Enter position"
                          />
                        </div>
                      </div>

                      <button
                        onClick={updateUserProfile}
                        className="w-full bg-blue-500 font-semibold text-white px-4 py-2 rounded text-lg hover:bg-blue-600"
                      >
                        Update Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Create Group Modal */}
          <Modal
            isOpen={createGroupModal}
            onClose={closeCreateGroupModal}
            title="Create New Group"
            onSubmit={createGroupChat}
            isSubmitDisabled={selectedUsers.length < 1 || !chatName.trim()}
            submitText={`Create Group (${selectedUsers.length} selected)`}
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
        title="Add User to Group"
        onSubmit={addUsersToGroup}
        isSubmitDisabled={selectedUsersToAdd.length === 0}
        submitText={`Add Users (${selectedUsersToAdd.length} selected)`}
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
          <h2 className="text-xl font-bold">Chats</h2>
        </div>
        {/* Chat List with Loading */}
        {chatsLoading ? (
          <ChatListLoading />
        ) : (
          <div className="space-y-2 mb-4 flex-1">
            {chats.map((chat) => (
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
                  {chat.type === "direct" ? (
                    <div
                      className={`p-2 rounded-full  transition-colors ${
                        chatId === chat.id
                          ? "bg-blue-500 "
                          : "bg-gray-700/50 hover:bg-gray-700"
                      }`}
                    >
                      <Icon icon="solar:user-linear" width="16" height="16" />
                    </div>
                  ) : (
                    <div
                      className={`p-2 rounded-full  transition-colors ${
                        chatId === chat.id
                          ? "bg-blue-500 "
                          : "bg-gray-700/50 hover:bg-gray-700"
                      }`}
                    >
                      <Icon
                        icon="solar:users-group-rounded-linear"
                        width="16"
                        height="16"
                      />
                    </div>
                  )}
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

      {/* Center Chat Area */}
      <div className="flex-1 bg-gray-100 ml-64 sm:ml-64 lg:ml-0 sticky top-0 left-0 z-20 overflow-y-auto flex flex-col h-full">
        {/* Header */}
        {currentChat && (
          <div className="fixed top-0 left-0 right-0 bg-white shadow ml-64 z-30">
            <div className="bg-white px-4 py-2 rounded shadow w-full flex items-center">
              <div className="w-full flex justify-start items-center  gap-2">
                {/* Show group members if it's a group chat */}
                {currentChat.type === "group" && (
                  <div className="flex justify-between items-center w-full">
                    <div className="flex justify-start gap-3 items-center w-full">
                      <div className="rounded-full bg-gray-200/50 p-2 text-blue-500 shadow">
                        <Icon
                          icon="solar:users-group-rounded-bold-duotone"
                          width="24"
                          height="24"
                        />
                      </div>
                      <div className="text-gray-800 font-semibold text-lg capitalize">
                        {getChatDisplayName(currentChat)}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border p-1 rounded-full border-gray-200 bg-gray-100">
                        {currentChat.users
                          .map((userId) =>
                            users.find(
                              (u) => u.id === userId || u.uid === userId
                            )
                          )
                          .filter(Boolean)
                          .map((member) => (
                            <div
                              key={member.id || member.uid}
                              className="flex items-center"
                            >
                              <img
                                title={member.displayName}
                                src={member.photoURL}
                                alt={member.displayName}
                                className="w-6 h-6 rounded-full"
                                onError={(e) => {
                                  e.target.src = "/default-avatar.png";
                                }}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                    {/* Add new user to group button */}
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
                        e.target.src = "/default-avatar.png";
                      }}
                    />
                    <span className="text-lg text-gray-800 font-semibold">
                      {selectedUser.displayName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-white rounded shadow flex-1 pt-12 pb-9 flex flex-col">
          {chatId ? (
            <>
              {/* Messages Area with Loading */}
              {messagesLoading ? (
                <MessagesLoading />
              ) : (
                <div className="flex-1 overflow-y-auto h-96 p-4">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex mb-4 ${
                          msg.senderId === user.uid
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div>
                          {" "}
                          <div className="flex items-end gap-1.5">
                            {msg.senderId !== user.uid && (
                              <img
                                src={getSenderData(msg.senderId)?.photoURL}
                                alt={getSenderDisplayName(msg.senderId)}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <div>
                              <div
                                className={`max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                                  msg.senderId === user.uid
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200/50  text-gray-800"
                                }`}
                              >
                                <div className="flex gap-1 text-xs items-center">
                                  {getSenderDisplayName(msg.senderId) && (
                                    <p className=" capitalize font-semibold">
                                      {getSenderDisplayName(msg.senderId)}{" "}
                                    </p>
                                  )}
                                  <span
                                    className={` hidden text-[9px] sm:flex font-normal border border-gray-300 rounded-full px-1.5 py-0.5 ${
                                      msg.senderId === user.uid
                                        ? "bg-white text-blue-500"
                                        : "bg-blue-500 text-white"
                                    }`}
                                  >
                                    {getSenderData(msg.senderId)?.department}
                                  </span>
                                  <span
                                    className={` hidden text-[9px] sm:flex font-normal border border-gray-300 rounded-full px-1.5 py-0.5 ${
                                      msg.senderId === user.uid
                                        ? "bg-white text-gray-800"
                                        : "bg-white text-gray-800 "
                                    }`}
                                  >
                                    {getSenderData(msg.senderId)?.position}
                                  </span>
                                </div>

                                <p className="text-sm">{msg.message}</p>
                              </div>
                              {/* Timestamp below the message bubble */}
                              <p
                                className={`text-xs text-gray-500 ${
                                  msg.senderId === user.uid
                                    ? "text-right"
                                    : "text-left"
                                }`}
                              >
                                {formatTimestamp(msg.timestamp)}
                              </p>
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
              <div className="fixed bottom-0 left-0 right-0 bg-gray-50 shadow-lg ml-64 z-30">
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
            <div className="flex items-center justify-center h-full text-gray-800 ">
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
