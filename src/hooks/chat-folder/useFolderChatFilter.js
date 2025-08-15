import { useState, useEffect, useCallback } from "react";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { useChatFolderStore } from "@/stores/chat-folder/useChatFolderStore";

export function useFolderChatFilter() {
  const { chats, setChats } = useMessageActionStore();
  const { selectedFolder, setSelectedFolder, clearSelectedFolder } =
    useChatFolderStore();

  const [originalChats, setOriginalChats] = useState(chats);

  // Keep a copy of unfiltered chats when no folder is selected
  useEffect(() => {
    if (!selectedFolder) {
      setOriginalChats(chats);
    }
  }, [chats, selectedFolder]);

  const handleClickFolder = useCallback(
    (folder) => {
      if (selectedFolder?.id === folder.id) {
        clearSelectedFolder();
        setChats(originalChats);
      } else {
        setSelectedFolder(folder);
        const folderChatIds = folder.chatIds || [];
        const filteredChats = originalChats.filter((chat) =>
          folderChatIds.includes(chat.id)
        );
        setChats(filteredChats);
      }
    },
    [
      selectedFolder,
      originalChats,
      setChats,
      setSelectedFolder,
      clearSelectedFolder,
    ]
  );

  const clearFolderFilter = useCallback(() => {
    setChats(originalChats);
    clearSelectedFolder();
  }, [originalChats, setChats, clearSelectedFolder]);

  return {
    chats,
    selectedFolder,
    handleClickFolder,
    clearFolderFilter,
  };
}
