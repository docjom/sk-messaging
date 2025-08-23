import { useCallback } from "react";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { useChatFolderStore } from "@/stores/chat-folder/useChatFolderStore";
export function useFolderChatFilter() {
  const { allChats, setChats } = useMessageActionStore();
  const { selectedFolder, setSelectedFolder, clearSelectedFolder } =
    useChatFolderStore();
  const handleShowAll = useCallback(() => {
    clearSelectedFolder();
    setChats(allChats);
  }, [allChats, setChats, clearSelectedFolder]);
  const handleClickFolder = useCallback(
    (folder) => {
      setSelectedFolder(folder);
      const filteredChats = allChats.filter((chat) =>
        folder.chatIds?.includes(chat.id)
      );
      setChats(filteredChats);
    },
    [allChats, setChats, setSelectedFolder]
  );

  return {
    selectedFolder,
    handleShowAll,
    handleClickFolder,
  };
}
