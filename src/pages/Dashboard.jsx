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
  onSnapshot,
  where,
} from "firebase/firestore";
import { Icon } from "@iconify/react";

// Function to send a message
const sendMessage = async (chatId, senderId, message) => {
  try {
    const messagesRef = collection(db, "chats", chatId, "messages");
    await addDoc(messagesRef, {
      senderId,
      message,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Toggle menu visibility
  const toggleMenu = () => {
    setMenu(true);
  };
  const closeMenu = () => {
    setMenu(false);
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

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUsers();
      } else {
        navigate("/");
      }
      setLoading(false);
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
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Fetch messages for the selected chat
  useEffect(() => {
    if (chatId) {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(messagesRef, orderBy("timestamp"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesArray = [];
        querySnapshot.forEach((doc) => {
          messagesArray.push({ id: doc.id, ...doc.data() });
        });
        setMessages(messagesArray);
      });

      return () => unsubscribe();
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
        // Find the newly created chat in the chats array
        const newChat = chats.find((chat) => chat.id === newChatId);
        setCurrentChat(newChat);
      }
    }
  };

  // Check if a direct chat already exists between the current user and selected user
  const checkExistingDirectChat = async (selectedUserId) => {
    try {
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("type", "==", "direct"));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const chatData = doc.data();
        // Check if both users are in this direct chat
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

    // If it's a direct chat, set the selected user
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
        // The chat will appear in the list due to the onSnapshot listener
      }
    } else {
      alert(
        "Please select at least one user and provide a chat name for a group chat."
      );
    }
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
      return "You";
    }
    const sender = users.find((u) => u.id === senderId);
    return sender?.displayName || "Unknown User";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* menu */}

      {menu && (
        <div>
          {" "}
          <div className="w-64 bg-gray-800 text-white fixed top-0 left-0 z-50 overflow-y-auto p-4 flex flex-col h-full">
            <div className=" rounded mb-4 flex items-center gap-2 justify-start">
              <img
                src={user?.photoURL}
                alt="User Profile"
                className="w-12 h-12 rounded-full"
              />
              <h1 className="text-lg font-semibold capitalize">
                {user?.displayName}
              </h1>
            </div>
            <hr className="border border-gray-700 m-1" />
            <div>
              <div className="flex items-center gap-4 cursor-pointer hover:bg-gray-700 p-2 rounded">
                <div>
                  <Icon
                    icon="solar:users-group-rounded-linear"
                    width="24"
                    height="24"
                  />
                </div>
                <span className="font-semibold">New Group</span>
              </div>
              <div className="flex items-center gap-4 cursor-pointer hover:bg-gray-700 p-2 rounded">
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
        </div>
      )}
      {/* menu end */}

      {/* Left Panel (Sidebar) */}
      <div className="w-64 bg-gray-800 text-white fixed lg:sticky top-0 left-0 z-10 overflow-y-auto p-4 flex flex-col h-full">
        <div className="flex items-center justify-start gap-2 mb-4">
          <div
            onClick={() => toggleMenu()}
            className="rounded-full bg-gray-700/50 p-2"
          >
            <Icon icon="duo-icons:menu" width="24" height="24" />
          </div>
          <h2 className="text-xl font-bold">Chats</h2>
        </div>

        {/* Chat List */}
        <div className="space-y-2 mb-4 flex-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`cursor-pointer hover:bg-gray-700 bg-gray-700/50 p-2 rounded ${
                chatId === chat.id ? "bg-blue-600" : ""
              }`}
            >
              <div className="font-semibold capitalize">
                {getChatDisplayName(chat)}
              </div>
              <div className="text-xs capitalize text-gray-400">
                {chat.type}
              </div>
            </div>
          ))}
        </div>

        {/* Users List for Direct Chat */}
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-bold mb-2">Start New Chat</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {users
              .filter((u) => u.id !== user?.uid) // Exclude current user
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
        </div>

        {/* Group Chat Section */}
        <div className="border-t border-gray-700 pt-4 mt-4">
          <h3 className="text-lg font-bold mb-2">Create Group Chat</h3>

          {/* Group Chat Name Input */}
          <input
            type="text"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            placeholder="Group Chat Name"
            className="p-2 w-full rounded outline-none border border-gray-200 mb-2"
          />

          {/* User Selection for Group Chat */}
          <div className="max-h-24 overflow-y-auto mb-2">
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

          <button
            onClick={createGroupChat}
            className="w-full bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={selectedUsers.length < 1 || !chatName.trim()}
          >
            Create Group ({selectedUsers.length} selected)
          </button>
        </div>
      </div>

      {/* Center Chat Area */}
      <div className="flex-1 bg-gray-100 ml-64 sm:ml-64 lg:ml-0 sticky top-0 left-0 z-20 overflow-y-auto flex flex-col h-full">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 bg-white shadow ml-64 z-30">
          <div className="bg-white px-4 py-2 rounded shadow w-full flex items-center">
            {currentChat && (
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
                                src={member.photoURL || "/default-avatar.png"}
                                alt={member.displayName}
                                className="w-6 h-6 rounded-full"
                                onError={(e) => {
                                  e.target.src = "/default-avatar.png";
                                }}
                              />
                              {/* <span className="text-sm capitalize text-gray-800">
                              {member.uid === user.uid
                                ? "You"
                                : member.displayName}
                            </span> */}
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="bg-gray-200/50 p-1 rounded-full">
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
                      src={selectedUser.photoURL || "/default-avatar.png"}
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
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded shadow flex-1 pt-12 pb-9 flex flex-col">
          {chatId ? (
            <>
              {/* Messages Area */}
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
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.senderId === user.uid
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200/50  text-gray-800"
                          }`}
                        >
                          <p className="text-xs capitalize font-semibold mb-1">
                            {getSenderDisplayName(msg.senderId)}
                          </p>
                          <p className="text-base">{msg.message}</p>
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
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>

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
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a chat or start a new conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
