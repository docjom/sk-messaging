import { useMemo } from "react";
import { useTypingStatus } from "@/stores/useTypingStatus";
import { useUserStore } from "@/stores/useUserStore";

const TypingIndicator = ({ getUserData }) => {
  const { typingUsers } = useTypingStatus();
  const { user } = useUserStore();

  const typingUsersArray = useMemo(() => {
    if (!typingUsers || !user?.uid) return [];

    return Object.entries(typingUsers)
      .filter(([uid, typing]) => typing && uid !== user.uid)
      .map(([uid]) => {
        const u = getUserData(uid);
        return {
          uid,
          displayName: u?.displayName || u?.name || "Someone",
        };
      });
  }, [typingUsers, user?.uid, getUserData]);

  if (typingUsersArray.length === 0) return null;

  // Handle multiple users typing
  const renderTypingText = () => {
    if (typingUsersArray.length === 1) {
      return `${typingUsersArray[0].displayName} is typing...`;
    } else if (typingUsersArray.length === 2) {
      return `${typingUsersArray[0].displayName} and ${typingUsersArray[1].displayName} are typing...`;
    } else {
      return `${typingUsersArray.length} people are typing...`;
    }
  };

  return (
    <div className="px-4 py-2">
      <div className="text-sm text-gray-500 px-2 flex items-center gap-2">
        <span>{renderTypingText()}</span>
        {/* Optional: Add typing animation dots */}
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
          <div
            className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
