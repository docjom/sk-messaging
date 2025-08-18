import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

export const useFirebaseStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeChats: 0,
    messagesToday: 0,
    messagesThisWeek: 0,
    onlineUsers: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribes = [];

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this week's date range
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    try {
      // 1. Total Users (real-time)
      const usersUnsubscribe = onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          setStats((prev) => ({
            ...prev,
            totalUsers: snapshot.size,
          }));
        },
        (error) => {
          console.error("Error fetching users:", error);
          setStats((prev) => ({ ...prev, error: error.message }));
        }
      );
      unsubscribes.push(usersUnsubscribe);

      // 2. Total Chats/Conversations (real-time)
      // This counts ALL chat conversations in your 'chats' collection
      const chatsUnsubscribe = onSnapshot(
        collection(db, "chats"),
        (snapshot) => {
          setStats((prev) => ({
            ...prev,
            activeChats: snapshot.size,
          }));
        },
        (error) => {
          console.error("Error fetching chats:", error);
        }
      );
      unsubscribes.push(chatsUnsubscribe);

      const onlineUsersUnsubscribe = onSnapshot(
        query(collection(db, "users"), where("active", "==", true)),
        (snapshot) => {
          setStats((prev) => ({
            ...prev,
            onlineUsers: snapshot.size,
          }));
        },
        (error) => {
          console.error("Error fetching online users:", error);
        }
      );
      unsubscribes.push(onlineUsersUnsubscribe);

      // 4. Messages Today (from subcollections)
      const fetchMessagesToday = async () => {
        try {
          let messagesToday = 0;
          let messagesThisWeek = 0;

          // First, get all chats
          const chatsSnapshot = await getDocs(collection(db, "chats"));

          // Then count messages in each chat's subcollection
          const messagePromises = chatsSnapshot.docs.map(async (chatDoc) => {
            const messagesRef = collection(db, "chats", chatDoc.id, "messages");

            // Count today's messages
            const todayQuery = query(
              messagesRef,
              where("timestamp", ">=", Timestamp.fromDate(today)),
              where("timestamp", "<", Timestamp.fromDate(tomorrow))
            );
            const todaySnapshot = await getDocs(todayQuery);

            // Count this week's messages
            const weekQuery = query(
              messagesRef,
              where("timestamp", ">=", Timestamp.fromDate(weekAgo))
            );
            const weekSnapshot = await getDocs(weekQuery);

            return {
              today: todaySnapshot.size,
              week: weekSnapshot.size,
            };
          });

          const results = await Promise.all(messagePromises);

          // Sum up all messages
          results.forEach((result) => {
            messagesToday += result.today;
            messagesThisWeek += result.week;
          });

          setStats((prev) => ({
            ...prev,
            messagesToday,
            messagesThisWeek,
            loading: false,
          }));
        } catch (error) {
          console.error("Error fetching messages:", error);
          setStats((prev) => ({
            ...prev,
            error: error.message,
            loading: false,
          }));
        }
      };

      fetchMessagesToday();
    } catch (error) {
      console.error("Error setting up stats listeners:", error);
      setStats((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }

    // Cleanup function
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  return stats;
};
