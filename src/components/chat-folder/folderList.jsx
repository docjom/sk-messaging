import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { useChatFolderStore } from "@/stores/chat-folder/useChatFolderStore";
import { formatTimestamp } from "@/composables/scripts";
import { useUserStore } from "@/stores/useUserStore";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/firebase";
import { EditTopicDialog } from "./editFolderTopic";
import { useMentions } from "@/stores/useUsersMentions";
import {
  CircleEllipsis,
  Pin,
  SquareChevronDown,
  MoreHorizontal,
} from "lucide-react";

export const FolderList = ({ topic }) => {
  const {
    setCurrentTopic,
    setTopicIdTo,
    topicId,
    chatId,
    clearMessage,
    clearReply,
    clearEdit,
    clearPastedImage,
  } = useMessageActionStore();
  const { setFolderSidebar } = useChatFolderStore();
  const { user } = useUserStore();
  const { clearMentionSuggestions } = useMentions();

  const handleSelectTopic = (id, topic) => {
    clearMentionSuggestions();
    clearMessage();
    clearReply();
    clearEdit();
    clearPastedImage();

    setTopicIdTo(id);
    setCurrentTopic(topic);
    if (window.innerWidth <= 768) {
      setFolderSidebar(false);
    }
  };

  const handlePinToggle = async (e) => {
    e.stopPropagation();
    try {
      const topicRef = doc(db, "chats", chatId, "topics", topic.id);

      if (isPinned) {
        await updateDoc(topicRef, {
          pin: arrayRemove(user.uid),
        });
      } else {
        await updateDoc(topicRef, {
          pin: arrayUnion(user.uid),
        });
      }

      console.log(`${isPinned ? "Unpinned" : "Pinned"} topic:`, topic.id);
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const isPinned = topic.pin?.includes(user?.uid);
  const isUnread = topic.lastSenderName && !topic.seenBy?.includes(user?.uid);

  return (
    <div
      onClick={() => handleSelectTopic(topic.id, topic)}
      className={`
        group relative flex items-center  gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 
        transition-colors duration-200 cursor-pointer border-b  border-gray-100 dark:border-gray-800/50
        ${
          topicId === topic.id
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            : ""
        }
        ${isUnread ? "bg-gray-50 dark:bg-gray-900/30" : ""}
      `}
    >
      {/* Topic Icon */}
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
        {topic.name === "General" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 0 24 24"
            className="text-gray-600 dark:text-gray-300"
          >
            <g fill="none">
              <path
                fill="currentColor"
                d="m17.543 21.694l-.645-.382zm.271-.458l.646.382zm-1.628 0l-.646.382zm.27.458l.646-.382zm-4.266-2.737l.693-.287zm2.705 1.539l-.013.75zm-1.352-.186l-.287.693zm8.267-1.353l.693.287zm-2.705 1.539l-.013-.75zm1.352-.186l.287.693zm.35-7.942l-.393.64zm.825.826l.64-.392zm-8.438-.826l-.392-.64zm-.826.826l-.64-.392zm3.333 7.411l.377-.648zm7.031-2.567a.75.75 0 1 0-1.498-.076zm-1.56-3.914a.75.75 0 1 0 1.479-.248zm-2.983 7.952l.27-.458l-1.29-.764l-.271.458zm-2.649-.458l.271.458l1.291-.764l-.271-.458zm1.358-.306A.13.13 0 0 1 17 21.25c.027 0 .075.016.102.062l-1.29.764c.531.899 1.845.899 2.377 0zm-.648-8.562h1.5v-1.5h-1.5zm-3.5 4v-.5h-1.5v.5zm-1.5 0c0 .572 0 1.039.025 1.419c.027.387.083.738.222 1.075l1.386-.574c-.05-.123-.09-.293-.111-.603a22 22 0 0 1-.022-1.317zm3.658 2.996c-.628-.01-.892-.052-1.078-.13l-.574 1.387c.475.196.998.232 1.626.243zm-3.41-.502a3.25 3.25 0 0 0 1.758 1.759l.574-1.386a1.75 1.75 0 0 1-.947-.947zm7.62 2.002c.628-.011 1.15-.047 1.626-.243l-.574-1.386c-.186.077-.45.118-1.078.129zm1.999-2.576a1.75 1.75 0 0 1-.947.947l.574 1.386a3.25 3.25 0 0 0 1.759-1.76zm-3.367-5.92c.833 0 1.405 0 1.846.043c.429.04.655.115.818.215l.784-1.28c-.438-.268-.921-.377-1.46-.429c-.529-.05-1.184-.049-1.988-.049zm2.664.258c.236.144.434.342.578.578l1.28-.784a3.25 3.25 0 0 0-1.074-1.073zM16.25 11.25c-.804 0-1.46 0-1.987.05c-.54.05-1.023.16-1.461.429l.784 1.279c.163-.1.39-.174.819-.215c.44-.042 1.012-.043 1.845-.043zm-3.5 5c0-.833 0-1.405.043-1.845c.04-.43.115-.656.215-.82l-1.28-.783c-.268.438-.377.921-.429 1.46c-.05.529-.049 1.184-.049 1.988zm.052-4.521a3.25 3.25 0 0 0-1.073 1.073l1.279.784c.144-.236.342-.434.578-.578zm4.029 9.125c-.098-.165-.197-.335-.297-.472a1.5 1.5 0 0 0-.456-.425l-.754 1.296c-.037-.021-.04-.04-.002.013c.048.065.106.162.218.352zm-1.95.392c.227.004.346.006.43.016c.071.008.053.014.013-.009l.754-1.296a1.5 1.5 0 0 0-.601-.186c-.17-.019-.37-.022-.57-.025zm3.579.372c.112-.19.17-.287.218-.352c.039-.053.035-.034-.002-.013l-.754-1.296c-.206.12-.347.276-.456.425c-.1.137-.2.306-.297.472zm.632-1.872c-.198.003-.399.006-.569.025c-.184.02-.393.064-.601.186l.754 1.296c-.04.023-.058.017.012.009c.085-.01.204-.012.43-.016zm2.142-1.784c-.02.378-.06.57-.117.708l1.386.574c.154-.372.207-.765.23-1.206zm1.417-4.086a2.9 2.9 0 0 0-.38-1.074l-1.279.784c.076.123.137.283.18.538z"
              />
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 3L5 21M19 3l-1.806 6.5M22 9H4m-2 7h7"
              />
            </g>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 0 16 16"
            className="text-gray-600 dark:text-gray-300"
          >
            <g fill="none">
              <path
                fill="url(#fluentColorChat160)"
                d="M8 2a6 6 0 0 0-5.27 8.872l-.71 2.49a.5.5 0 0 0 .638.612l2.338-.779A6 6 0 1 0 8 2"
              />
              <path
                fill="url(#fluentColorChat161)"
                d="M6 7a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 7m.5 1.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1"
              />
              <defs>
                <linearGradient
                  id="fluentColorChat160"
                  x1={2.429}
                  x2={12.905}
                  y1={4.25}
                  y2={22.111}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#0fafff" />
                  <stop offset={1} stopColor="#cc23d1" />
                </linearGradient>
                <linearGradient
                  id="fluentColorChat161"
                  x1={6.35}
                  x2={6.728}
                  y1={6.553}
                  y2={9.801}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#fdfdfd" />
                  <stop offset={1} stopColor="#cceaff" />
                </linearGradient>
              </defs>
            </g>
          </svg>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3
              className={`text-sm font-medium truncate ${
                isUnread
                  ? "text-gray-900 dark:text-white font-semibold"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {topic.name}
            </h3>

            {/* Pin indicator */}
            {isPinned && (
              <Pin
                size={12}
                className="text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
            )}
          </div>

          {/* Timestamp and status */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {/* Read status */}
            {topic.lastSenderName && topic.seenBy?.includes(user?.uid) && (
              <div className="text-green-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <g fill="none">
                    <path
                      fill="currentColor"
                      d="M4.565 12.407a.75.75 0 1 0-1.13.986zM7.143 16.5l-.565.493a.75.75 0 0 0 1.13 0zm8.422-8.507a.75.75 0 1 0-1.13-.986zm-5.059 3.514a.75.75 0 0 0 1.13.986zm-.834 3.236a.75.75 0 1 0-1.13-.986zm-6.237-1.35l3.143 3.6l1.13-.986l-3.143-3.6zm4.273 3.6l1.964-2.25l-1.13-.986l-1.964 2.25zm3.928-4.5l1.965-2.25l-1.13-.986l-1.965 2.25zm1.965-2.25l1.964-2.25l-1.13-.986l-1.964 2.25z"
                    />
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="m20 7.563l-4.286 4.5M11 16l.429.563l2.143-2.25"
                    />
                  </g>
                </svg>
              </div>
            )}

            {/* Timestamp */}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(topic.lastMessageTime)}
            </span>

            {/* Options menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0  group-hover:opacity-100 opacity-100 sm:opacity-0 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal size={14} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 px-2 py-1.5 h-auto text-sm font-semibold"
                  onClick={handlePinToggle}
                >
                  <Pin size={16} />
                  {isPinned ? "Unpin Topic" : "Pin Topic"}
                </Button>
                <EditTopicDialog topic={topic} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Message Preview */}
        {topic.lastSenderName && (
          <div className="flex items-center gap-1 min-w-0">
            <span
              className={`text-xs font-medium flex-shrink-0 ${
                topic.lastSenderName === user?.displayName
                  ? "text-blue-500"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {topic.lastSenderName === user?.displayName
                ? "You"
                : topic.lastSenderName}
              :
            </span>
            <span
              className={`text-xs truncate ${
                isUnread
                  ? "text-gray-900 dark:text-gray-100 font-medium"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {topic.lastMessage}
            </span>
          </div>
        )}
      </div>

      {/* Unread indicator */}
      {isUnread && (
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
      )}
    </div>
  );
};
