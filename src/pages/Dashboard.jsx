import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
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
  const [selectedUsers, setSelectedUsers] = useState([]); // Track selected users for group chats
  const [chatName, setChatName] = useState(""); // Track the name of the chat
  const [selectedUser, setSelectedUser] = useState(null); // Track selected user for direct chat
  const [currentChat, setCurrentChat] = useState(null); // Track current chat info

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
      const newChatId = await createChat("direct", [user.uid, selectedUserData.id], selectedUserData.displayName);
      if (newChatId) {
        setChatId(newChatId);
        // Find the newly created chat in the chats array
        const newChat = chats.find(chat => chat.id === newChatId);
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
        if (chatData.users.includes(user.uid) && chatData.users.includes(selectedUserId)) {
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
      const otherUserId = chat.users.find(uid => uid !== user.uid);
      const otherUser = users.find(u => u.id === otherUserId);
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
    if (e.key === 'Enter' && !e.shiftKey) {
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
        name: name || (type === "direct" ? "Direct Chat" : chatName),
        users: userIds,
        createdAt: serverTimestamp(),
      });
      return chatDoc.id;
    } catch (error) {
      console.error("Error creating chat:", error);
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
    if (selectedUsers.length >= 2 && chatName.trim()) {
      const allUsers = [...selectedUsers, user.uid]; // Include current user
      const newChatId = await createChat("group", allUsers, chatName);
      if (newChatId) {
        console.log("Group chat created with ID:", newChatId);
        setChatName(""); // Clear input
        setSelectedUsers([]); // Clear selections
      }
    } else {
      alert("Please select at least two users and provide a chat name for a group chat.");
    }
  };

  // Toggle user selection for group chats
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Get display name for sender
  const getSenderDisplayName = (senderId) => {
    if (senderId === user?.uid) {
      return "You";
    }
    const sender = users.find(u => u.id === senderId);
    return sender?.displayName || "Unknown User";
  };

  // Get chat display name
  const getChatDisplayName = (chat) => {
    if (chat.type === "direct") {
      const otherUserId = chat.users.find(uid => uid !== user.uid);
      const otherUser = users.find(u => u.id === otherUserId);
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
      {/* Left Panel (Sidebar) */}
      <div className="w-64 bg-gray-800 text-white fixed lg:sticky top-0 left-0 z-50 overflow-y-auto p-4 flex flex-col h-full">
        <h2 className="text-xl font-bold mb-4">Chats</h2>

        {/* Chat List */}
        <div className="space-y-2 mb-4 flex-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`cursor-pointer hover:bg-gray-700 p-2 rounded ${
                chatId === chat.id ? "bg-blue-600" : ""
              }`}
            >
              <div className="font-semibold">{getChatDisplayName(chat)}</div>
              <div className="text-xs text-gray-400">{chat.type}</div>
            </div>
          ))}
        </div>

        {/* Users List for Direct Chat */}
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-bold mb-2">Start New Chat</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {users
              .filter(u => u.id !== user?.uid) // Exclude current user
              .map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="cursor-pointer p-2 rounded hover:bg-gray-700 text-sm"
                >
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
            className="p-2 w-full rounded mb-2 text-black"
          />

          {/* User Selection for Group Chat */}
          <div className="max-h-24 overflow-y-auto mb-2">
            {users
              .filter(u => u.id !== user?.uid)
              .map((u) => (
                <div
                  key={u.id}
                  onClick={() => toggleUserSelection(u.id)}
                  className={`cursor-pointer p-1 rounded text-sm ${
                    selectedUsers.includes(u.id)
                      ? "bg-blue-500"
                      : "hover:bg-gray-700"
                  }`}
                >
                  {u.displayName}
                </div>
              ))}
          </div>

          <button
            onClick={createGroupChat}
            className="w-full bg-green-500 text-white px-4 py-2 rounded text-sm"
            disabled={selectedUsers.length < 2 || !chatName.trim()}
          >
            Create Group ({selectedUsers.length} selected)
          </button>
        </div>

        {/* Logout Button */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Center Chat Area */}
      <div className="lg:flex-1 bg-gray-100 p-4 ml-64 sm:ml-64 lg:ml-0 flex flex-col">
        {/* Header */}
        <div className="bg-white p-4 rounded shadow mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold capitalize">
              Welcome, {user?.displayName}
            </h1>
            {currentChat && (
              <p className="text-gray-600 capitalize">
                Chat: {getChatDisplayName(currentChat)}
              </p>
            )}
          </div>
          <img
            src={user?.photoURL}
            alt="User Profile"
            className="w-12 h-12 rounded-full"
          />
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded shadow flex-1 flex flex-col">
          {chatId ? (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex mb-4 ${
                        msg.senderId === user.uid ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.senderId === user.uid 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-black'
                      }`}>
                        <p className="text-xs font-semibold mb-1">
                          {getSenderDisplayName(msg.senderId)}
                        </p>
                        <p>{msg.message}</p>
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
              <div className="p-4 border-t">
                <div className="flex">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-500 text-white px-6 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!message.trim()}
                  >
                    Send
                  </button>
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