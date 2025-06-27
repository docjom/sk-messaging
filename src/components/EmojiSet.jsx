import React, { useState, useEffect } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const emojis = [
  {
    alt: "❤",
    srcSet: "2764_fe0f",
    label: "heart",
  },
  {
    alt: "😀",
    srcSet: "1f600",
    label: "grinning",
  },
  {
    alt: "🙏",
    srcSet: "1f64f",
    label: "pray",
  },
  {
    alt: "😭",
    srcSet: "1f62d",
    label: "crying",
  },
  {
    alt: "😠",
    srcSet: "1f620",
    label: "angry",
  },
];

export const EmojiSet = ({ messageId, userId, chatId, onSelect }) => {
  const [reactions, setReactions] = useState({});

  useEffect(() => {
    // Listen to reactions in real-time
    const messageRef = doc(db, "chats", chatId, "messages", messageId);

    const unsubscribe = onSnapshot(messageRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setReactions(data.reactions || {});
      }
    });

    return () => unsubscribe();
  }, [chatId, messageId]);

  const handleEmojiClick = async (emoji) => {
    onSelect?.();
    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);

      // Check if user already reacted with this specific emoji
      const currentEmojiReactions = reactions[emoji.srcSet] || [];
      const userAlreadyReactedWithThis = currentEmojiReactions.some(
        (reaction) => reaction.userId === userId
      );

      let updatedReactions = { ...reactions };

      if (userAlreadyReactedWithThis) {
        // Remove user's reaction from this emoji (toggle off)
        updatedReactions[emoji.srcSet] = currentEmojiReactions.filter(
          (reaction) => reaction.userId !== userId
        );

        // If no reactions left for this emoji, remove the key entirely
        if (updatedReactions[emoji.srcSet].length === 0) {
          delete updatedReactions[emoji.srcSet];
        }
      } else {
        // First, remove user's reaction from ALL other emojis
        Object.keys(updatedReactions).forEach((emojiKey) => {
          updatedReactions[emojiKey] = updatedReactions[emojiKey].filter(
            (reaction) => reaction.userId !== userId
          );

          // Remove emoji key if no reactions left
          if (updatedReactions[emojiKey].length === 0) {
            delete updatedReactions[emojiKey];
          }
        });

        // Then add user's reaction to the clicked emoji
        const newReaction = {
          userId: userId,
          timestamp: new Date().toISOString(),
        };

        updatedReactions[emoji.srcSet] = [
          ...(updatedReactions[emoji.srcSet] || []),
          newReaction,
        ];
      }

      // Update Firestore
      await updateDoc(messageRef, {
        reactions: updatedReactions,
      });
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  // Check if current user has reacted with specific emoji
  const hasUserReacted = (emojiSrcSet) => {
    const emojiReactions = reactions[emojiSrcSet] || [];
    return emojiReactions.some((reaction) => reaction.userId === userId);
  };

  // Get reaction count for each emoji
  const getReactionCount = (emojiSrcSet) => {
    const emojiReactions = reactions[emojiSrcSet] || [];
    return emojiReactions.length;
  };

  return (
    <div className="flex gap-2 border p-1 rounded-full bg-transparent backdrop-blur-sm">
      {emojis.map((emoji, index) => {
        const userReacted = hasUserReacted(emoji.srcSet);
        const count = getReactionCount(emoji.srcSet);

        return (
          <div key={index} className="relative">
            <div
              onClick={() => {
                handleEmojiClick(emoji);
              }}
              className={`cursor-pointer transition-all duration-200 rounded-full p-1 ${
                userReacted
                  ? "bg-blue-100 ring-2 ring-blue-300 transform scale-110"
                  : "hover:bg-gray-100"
              }`}
              title={`${count} reaction${count > 1 ? "s" : ""}`}
            >
              <picture>
                <source
                  srcSet={`https://fonts.gstatic.com/s/e/notoemoji/latest/${emoji.srcSet}/512.webp`}
                  type="image/webp"
                />
                <img
                  src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${emoji.srcSet}/512.gif`}
                  alt={emoji.alt}
                  width="32"
                  height="32"
                />
              </picture>
            </div>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
