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
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chatName, setChatName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); // Store selected user details

  // Fetch current user and user list
  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
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

  const handleSendMessage = async () => {
    if (!chatId) {
      console.error("Chat ID is not set.");
      return; // Prevent sending the message if chatId is invalid
    }

    if (message.trim() !== "" && selectedUser) {
      await sendMessage(chatId, user.uid, message);
      setMessage(""); // Clear input after sending the message
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSelectedUsers([user.id]); // Only allow one user selection for direct chat

    // Check if a direct chat already exists with this user
    const existingChat = await checkExistingChat(user);
    if (existingChat) {
      // Set the chatId if the chat already exists
      setChatId(existingChat.id);
    } else {
      // Create a new chat if no existing chat is found
      const chatId = await createChat("direct", [user.id, user.uid]);
      setChatId(chatId); // Set the chatId after creating the chat
    }
  };

  const checkExistingChat = async (selectedUser) => {
    // Check for an existing direct chat between the current user and the selected user
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("users", "array-contains", selectedUser.id)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Return the first matching chat if it exists
      return querySnapshot.docs[0].data();
    }
    return null;
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate("/");
    });
  };

  const createGroupChat = async () => {
    if (selectedUsers.length >= 2) {
      // Allow multiple users for a group chat
      const chatId = await createChat("group", selectedUsers);
      console.log("Group chat created with ID:", chatId);
    } else {
      alert("Please select at least two users for a group chat.");
    }
  };

  const createChat = async (type, users) => {
    try {
      const chatName = type === "group" ? chatName : users.join(", ");
      const chatsRef = collection(db, "chats");
      const chatDoc = await addDoc(chatsRef, {
        type,
        name: chatName,
        users,
        createdAt: serverTimestamp(),
      });

      // After creating the chat, return the chatId
      return chatDoc.id;
    } catch (error) {
      console.error("Error creating chat:", error);
    }
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

        {/* Create Group Chat Button */}
        <div className="flex justify-start gap-2 mb-4">
          <button
            onClick={createGroupChat}
            className="py-2 px-5 border rounded-full bg-gray-700 hover:bg-gray-600"
          >
            <Icon
              icon="material-symbols:group-rounded"
              width="24"
              height="24"
            />
            GM
          </button>
        </div>

        {/* Users List */}
        <h2 className="text-xl font-bold mb-4">Users List</h2>
        <div className="space-y-4 mb-4">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => handleSelectUser(u)}
              className={`cursor-pointer p-2 rounded ${
                selectedUsers.includes(u.id)
                  ? "bg-blue-500"
                  : "hover:bg-gray-700"
              }`}
            >
              {u.displayName}
            </div>
          ))}
        </div>

        {/* Group Chat Input */}
        <div className="mt-4">
          <input
            type="text"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            placeholder="Group Chat Name"
            className="p-2 w-full rounded mb-4"
          />
          <button
            onClick={createGroupChat}
            className="w-full bg-green-500 text-white px-4 py-2 rounded"
          >
            Create Group Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="space-y-4 mt-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setChatId(chat.id)}
              className="cursor-pointer hover:bg-gray-700 p-2 rounded"
            >
              {chat.name}
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white px-4 py-2 rounded mt-4"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Center Chat Area */}
      <div className="lg:flex-1 bg-gray-100 p-4 ml-64 sm:ml-64 lg:ml-0">
        <div className="bg-white p-4 rounded shadow mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Welcome, {user.displayName}
          </h1>
          <img
            src={user.photoURL}
            alt="User Profile"
            className="w-12 h-12 rounded-full"
          />
        </div>

        {/* Chat Messages */}
        <div className="bg-white p-4 rounded shadow flex-1">
          <div>
            <h1 className="text-2xl font-semibold">
              Selected User: {selectedUser?.displayName || "None"}
            </h1>
            <img
              src={selectedUser?.photoURL || ""}
              alt="User Profile"
              className="w-12 h-12 rounded-full"
            />
          </div>

          <div>
            {/* Display conversation */}
            <div className="overflow-y-auto max-h-[60vh] mb-4">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg.id} className="flex items-start mb-4">
                    <img
                      src={user.photoURL}
                      alt="User Profile"
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <div>
                      <p className="font-semibold">{msg.senderId}</p>
                      <p>{msg.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No messages available</p>
              )}
            </div>
          </div>

          {/* Message Input */}
          <div className="flex p-4 bg-gray-200 rounded">
            <input
              type="text"
              className="flex-1 p-2 border rounded"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              onClick={handleSendMessage}
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
