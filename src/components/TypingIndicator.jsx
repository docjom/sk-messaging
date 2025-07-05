import React from "react";
import { useTypingStatus } from "@/stores/useTypingStatus";

export const TypingIndicator = ({ chatId, getName }) => {
  const { typingUsers } = useTypingStatus();

  const getTypingMessage = () => {
    const chatTypingUsers = typingUsers?.[chatId];
    if (!Array.isArray(chatTypingUsers) || chatTypingUsers.length === 0)
      return null;

    const names = chatTypingUsers
      .filter((u) => u.isTyping)
      .map((u) => getName(u.userId) || "Someone");

    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
    return `${names[0]} and ${names.length - 1} others are typing`;
  };

  return (
    <>
      {getTypingMessage() && (
        <div className="flex items-center">
          <span className=" text-gray-700 dark:text-gray-300 ">
            {getTypingMessage()}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <circle cx="18" cy="12" r="0" fill="currentColor">
              <animate
                attributeName="r"
                begin=".67"
                calcMode="spline"
                dur="1.5s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                repeatCount="indefinite"
                values="0;2;0;0"
              />
            </circle>
            <circle cx="12" cy="12" r="0" fill="currentColor">
              <animate
                attributeName="r"
                begin=".33"
                calcMode="spline"
                dur="1.5s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                repeatCount="indefinite"
                values="0;2;0;0"
              />
            </circle>
            <circle cx="6" cy="12" r="0" fill="currentColor">
              <animate
                attributeName="r"
                begin="0"
                calcMode="spline"
                dur="1.5s"
                keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                repeatCount="indefinite"
                values="0;2;0;0"
              />
            </circle>
          </svg>
        </div>
      )}
    </>
  );
};
