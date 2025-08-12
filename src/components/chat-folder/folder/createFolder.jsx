import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Folder,
  MessageCircle,
  X,
  Users,
  Hash,
  Bot,
  Settings,
  Trash2,
  Edit3,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/useUserStore";
import { db } from "@/firebase";
import {
  serverTimestamp,
  collection,
  addDoc,
  arrayUnion,
  updateDoc,
  doc,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { useFolderStore } from "@/stores/chat-folder/useFolderStore";
import FolderChatsDialog from "./folderChatsDialog";

const FolderManagementSystem = () => {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [selectedChats, setSelectedChats] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddChatsDialogOpen, setIsAddChatsDialogOpen] = useState(false);
  const [isViewChatsDialogOpen, setIsViewChatsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { hasFolders, setHasFolders, checkAndUpdateHasFolders, folders } =
    useFolderStore();

  const { chats, users } = useMessageActionStore();
  const user = useUserStore((s) => s?.user);

  const getChatPhoto = useCallback(
    (chat) => {
      if (chat.type === "direct") {
        const otherUserId = chat.users.find((uid) => uid !== user?.uid);
        const otherUser = users.find((u) => u.id === otherUserId);
        return otherUser?.photoURL;
      }
      return chat.photoURL;
    },
    [user?.uid, users]
  );

  const getFilteredChats = () => {
    return chats.filter((chat) =>
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getChatIcon = (type) => {
    switch (type) {
      case "private":
        return <Users className="h-4 w-4" />;
      case "group":
        return <Users className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const handleViewFolderChats = (folder, e) => {
    e.stopPropagation();
    setSelectedFolder(folder);
    setIsViewChatsDialogOpen(true);
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim() || !user?.uid) return;

    setIsLoading(true);
    try {
      const folderData = {
        folderName: folderName.trim(),
        chatIds: selectedChats,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "folders"), folderData);

      if (!hasFolders) {
        setHasFolders(user.uid);
      }

      setFolderName("");
      setSelectedChats([]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChatsToFolder = async (e) => {
    e.stopPropagation();

    if (!selectedFolder || selectedChats.length === 0) return;

    setIsLoading(true);
    try {
      const folderRef = doc(db, "folders", selectedFolder.id);
      await updateDoc(folderRef, {
        chatIds: arrayUnion(...selectedChats),
        updatedAt: serverTimestamp(),
      });

      setSelectedChats([]);
      setIsAddChatsDialogOpen(false);
      setSelectedFolder(null);
    } catch (error) {
      console.error("Error adding chats to folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveChatFromFolder = async (folderId, chatId) => {
    try {
      const folderRef = doc(db, "folders", folderId);
      await updateDoc(folderRef, {
        chatIds: arrayRemove(chatId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error removing chat from folder:", error);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await deleteDoc(doc(db, "folders", folderId));
      await checkAndUpdateHasFolders(user.uid);
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const toggleChatSelection = (chatId) => {
    setSelectedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  return (
    <div className=" p-2 border max-w-4xl mx-auto rounded space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">My Folders</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="">
              <Plus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-name" className="mb-0.5">
                  Folder Name
                </Label>
                <Input
                  id="folder-name"
                  placeholder="Enter folder name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label className="mb-0.5">Add Chats (Optional)</Label>
                <Input
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {getFilteredChats().map((chat) => (
                    <div
                      key={chat.id}
                      className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        selectedChats.includes(chat.id)
                          ? "bg-blue-50 border border-blue-200"
                          : ""
                      }`}
                      onClick={() => toggleChatSelection(chat.id)}
                    >
                      <div className=" mr-3">
                        {" "}
                        <Avatar>
                          <AvatarImage src={getChatPhoto(chat)} />
                          <AvatarFallback>
                            {" "}
                            {chat.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{chat.name}</div>
                        <div className="text-sm text-gray-500">
                          {chat.lastMessage}
                        </div>
                      </div>
                      {getChatIcon(chat.type)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleCreateFolder}
                disabled={!folderName.trim() || isLoading}
              >
                {isLoading ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folders List */}
      <div className="grid gap-2">
        {folders.map((folder) => (
          <div key={folder.id} className="border rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={(e) => handleViewFolderChats(folder, e)}
              >
                <Folder className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-base">{folder.folderName}</h3>
                <Badge variant="secondary">{folder.chatIds.length} chats</Badge>
              </div>

              <div className="flex items-center gap-2">
                {!folder.isDefault && (
                  <>
                    <Dialog
                      open={
                        isAddChatsDialogOpen && selectedFolder?.id === folder.id
                      }
                      onOpenChange={(open) => {
                        setIsAddChatsDialogOpen(open);
                        if (open) setSelectedFolder(folder);
                        else setSelectedFolder(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Chats
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>
                            Add Chats to {folder.folderName}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Search chats..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-1">
                            {getFilteredChats().filter(
                              (chat) => !folder.chatIds.includes(chat.id)
                            ).length === 0 ? (
                              <div className="text-center py-4 text-sm text-gray-500">
                                No available chats to add
                              </div>
                            ) : (
                              getFilteredChats()
                                .filter(
                                  (chat) => !folder.chatIds.includes(chat.id)
                                )
                                .map((chat) => (
                                  <div
                                    key={chat.id}
                                    className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                      selectedChats.includes(chat.id)
                                        ? "bg-blue-50 border border-blue-200"
                                        : ""
                                    }`}
                                    onClick={() => toggleChatSelection(chat.id)}
                                  >
                                    <div className="mr-3">
                                      <Avatar>
                                        <AvatarImage src={getChatPhoto(chat)} />
                                        <AvatarFallback>
                                          {chat.name[0]?.toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {chat.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {chat.lastMessage}
                                      </div>
                                    </div>
                                    {getChatIcon(chat.type)}
                                  </div>
                                ))
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedChats([])}
                            >
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button
                            onClick={(e) => handleAddChatsToFolder(e)}
                            disabled={selectedChats.length === 0 || isLoading}
                          >
                            {isLoading
                              ? "Adding..."
                              : `Add ${selectedChats.length} Chat${
                                  selectedChats.length !== 1 ? "s" : ""
                                }`}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFolder(folder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Chats in folder */}
            {/* <div className="space-y-2">
              {folder.chatIds.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No chats in this folder
                </p>
              ) : (
                folder.chatIds.map((chatId) => {
                  const chat = mockChats.find((c) => c.id === chatId);
                  if (!chat) return null;

                  return (
                    <div
                      key={chatId}
                      className="flex items-center p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="text-xl mr-3">{chat.avatar}</div>
                      <div className="flex-1">
                        <div className="font-medium">{chat.name}</div>
                        <div className="text-sm text-gray-500">
                          {chat.lastMessage}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getChatIcon(chat.type)}
                        {!folder.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveChatFromFolder(folder.id, chatId)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div> */}
          </div>
        ))}
      </div>

      {folders.length === 0 && (
        <div className="text-center">
          <Folder className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 mb-2">No folders yet</p>
          <p className="text-sm text-gray-400">
            Create folders to organize your chats
          </p>
        </div>
      )}

      {/* View Folder Chats Dialog */}
      <FolderChatsDialog
        isOpen={isViewChatsDialogOpen}
        onOpenChange={setIsViewChatsDialogOpen}
        folder={selectedFolder}
        onRemoveChat={handleRemoveChatFromFolder}
      />
    </div>
  );
};

export default FolderManagementSystem;
