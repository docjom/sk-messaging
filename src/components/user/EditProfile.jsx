import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
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
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from "firebase/storage";

export function EditProfile({ currentUserId }) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [profilePhotoURL, setProfilePhotoURL] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [newProfilePhoto, setNewProfilePhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadUserProfile() {
      const snap = await getDoc(doc(db, "users", currentUserId));
      if (snap.exists()) {
        const data = snap.data();
        setName(data.displayName || "");
        setDepartment(data.department || "");
        setPhone(data.phone || "");
        setPosition(data.position || "");
        setProfilePhotoURL(data.photoURL || "");
        setImagePreview(data.photoURL || "");
      }
    }
    loadUserProfile();
  }, [currentUserId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfilePhoto(file);
      const fileUrl = URL.createObjectURL(file);
      setImagePreview(fileUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let photoURL = profilePhotoURL;

    if (newProfilePhoto) {
      try {
        const storage = getStorage();
        const oldImageRef = ref(storage, `profilePhotos/${currentUserId}`);

        try {
          await getMetadata(oldImageRef);
          await deleteObject(oldImageRef);
        } catch (error) {
          if (error.code === "storage/object-not-found") {
            console.log("Old profile photo does not exist. Skipping delete.");
          } else {
            throw error;
          }
        }

        const storageRef = ref(storage, `profilePhotos/${currentUserId}`);
        const uploadTask = uploadBytesResumable(storageRef, newProfilePhoto);

        await uploadTask;

        photoURL = await getDownloadURL(storageRef);
        toast("Profile photo uploaded successfully!");
      } catch (error) {
        console.error("Error uploading profile photo:", error);
        toast("Failed to upload profile photo.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const userDocRef = doc(db, "users", currentUserId);
      await updateDoc(userDocRef, {
        displayName: name,
        department,
        phone,
        position,
        photoURL,
        updatedAt: new Date(),
      });

      toast("Profile updated successfully!");
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className=" w-full mb-1 flex justify-start gap-4 items-center"
        >
          <Icon icon="iconoir:profile-circle" width="30" height="30" /> Manage
          Profile
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              To make changes, click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 mb-4">
            {/* Display current or selected profile image */}
            <Avatar className="w-20 h-20 border">
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
            <Label htmlFor="name" className="mb-1">
              Name
            </Label>
            <Input
              id="name"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="department" className="mb-1">
              Department
            </Label>
            <Input
              id="department"
              type="text"
              placeholder="e.g. Marketing"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="phone" className="mb-1">
              Phone
            </Label>
            <Input
              id="phone"
              required
              type="tel"
              placeholder="e.g. +63 123 456 7890"
              pattern="^\+?[0-9]{10,15}$"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="position" className="mb-1">
              Position
            </Label>
            <Input
              id="position"
              type="text"
              placeholder="e.g. Software Engineer"
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
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
