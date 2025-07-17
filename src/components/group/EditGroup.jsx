import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GroupMembers } from "./GroupMembers";
import { ManageGroupMembers } from "./ManageGroup";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { CreateGroupTopic } from "./CreateGroupTopic";
import { useChatFolderStore } from "@/stores/chat-folder/useChatFolderStore";
import { useMessageActionStore } from "@/stores/useMessageActionStore";

export function EditGroup({ chatId, currentUserId }) {
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newProfilePhoto, setNewProfilePhoto] = useState(null);
  const [profilePhotoURL, setProfilePhotoURL] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const { setFolderSidebar } = useChatFolderStore();
  const { currentChat } = useMessageActionStore();

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "chats", chatId));
      if (!snap.exists()) return;
      const data = snap.data();
      setName(data.name || "");
      setProfilePhotoURL(data.photoURL || "");
      setIsAdmin(data.userRoles?.[currentUserId] === "admin");
    }
    load();
  }, [chatId, currentUserId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfilePhoto(file);
      const fileUrl = URL.createObjectURL(file);
      setImagePreview(fileUrl);
    }
  };

  const handleCloseAll = () => {
    setIsOpen(false);
    setFolderSidebar(true);
    toast("Topic created!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let photoURL = profilePhotoURL;

    if (newProfilePhoto) {
      try {
        // Delete the old image if it exists
        if (profilePhotoURL) {
          const storage = getStorage();
          const oldImageRef = ref(storage, `groupPhotos/${chatId}`);
          await deleteObject(oldImageRef); // Delete the old image from storage
        }

        // Upload the new image
        const storage = getStorage();
        const storageRef = ref(storage, `groupPhotos/${chatId}`);
        const uploadTask = uploadBytesResumable(storageRef, newProfilePhoto);

        await uploadTask;

        // Get the download URL of the uploaded image
        photoURL = await getDownloadURL(storageRef);
        toast(" Upload profile successful!");
      } catch (error) {
        console.error("Error uploading profile photo:", error);
        toast.error("Failed to upload profile photo.");
        setIsLoading(false);
        return;
      }
    }

    try {
      // Update Firestore with the new name and photo URL
      await updateDoc(doc(db, "chats", chatId), {
        name,
        photoURL, // Update the photo URL in Firestore
      });
      setIsOpen(false); // Close the dialog
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className=" flex justify-start w-full mb-1">
          <Icon
            icon="solar:settings-minimalistic-broken"
            width="20"
            height="20"
          />
          Manage Group
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              To make changes, click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 mb-4">
            {/* Display current or selected image */}
            <Avatar className="w-20 h-20">
              <AvatarImage src={imagePreview || profilePhotoURL} />
              <AvatarFallback> {name[0]?.toUpperCase() || "P"}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" type="button" className="border">
              <label htmlFor="profile-photo" className="cursor-pointer">
                Change
              </label>
            </Button>
            <input
              type="file"
              id="profile-photo"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="group-name" className="mb-1">
              Group Name
            </Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <hr className="my-4" />
          <div className="mb-1">
            <GroupMembers chatId={chatId} className="w-full" />
          </div>

          <div className="mb-5">
            {isAdmin && (
              <>
                <ManageGroupMembers
                  chatId={chatId}
                  currentUserId={currentUserId}
                />
                {!currentChat.hasChatTopic && (
                  <CreateGroupTopic
                    chatId={chatId}
                    currentUserId={currentUserId}
                    onClose={handleCloseAll}
                  />
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && (
                <Icon
                  icon="line-md:loading-alt-loop"
                  width="16"
                  height="16"
                  className="mr-2"
                />
              )}
              {isLoading ? "Updating..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
