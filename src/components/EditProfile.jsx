import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
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
} from "firebase/storage"; // Firebase Storage imports

export function EditProfile({ currentUserId }) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [profilePhotoURL, setProfilePhotoURL] = useState(""); // Store profile photo URL
  const [imagePreview, setImagePreview] = useState(""); // For image preview before upload
  const [newProfilePhoto, setNewProfilePhoto] = useState(null); // For storing the new profile image
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Dialog open state

  useEffect(() => {
    async function loadUserProfile() {
      const snap = await getDoc(doc(db, "users", currentUserId));
      if (snap.exists()) {
        const data = snap.data();
        setName(data.displayName || "");
        setDepartment(data.department || "");
        setPhone(data.phone || "");
        setPosition(data.position || "");
        setProfilePhotoURL(data.photoURL || ""); // Set the current profile photo URL
        setImagePreview(data.photoURL || ""); // Display existing profile photo as preview
      }
    }
    loadUserProfile();
  }, [currentUserId]);

  // Handle selecting a new profile image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfilePhoto(file);
      const fileUrl = URL.createObjectURL(file);
      setImagePreview(fileUrl); // Preview the selected image
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let photoURL = profilePhotoURL; // Default to current photo if no new image

    if (newProfilePhoto) {
      // If there’s a new profile photo, delete the old one and upload the new one
      try {
        const storage = getStorage();
        const oldImageRef = ref(storage, `profilePhotos/${currentUserId}`);

        // Check if the old image exists
        try {
          await getMetadata(oldImageRef);
          await deleteObject(oldImageRef); // Delete old image
        } catch (error) {
          if (error.code === "storage/object-not-found") {
            // If the object is not found, we skip the deletion
            console.log("Old profile photo does not exist. Skipping delete.");
          } else {
            throw error;
          }
        }

        // Upload the new image
        const storageRef = ref(storage, `profilePhotos/${currentUserId}`);
        const uploadTask = uploadBytesResumable(storageRef, newProfilePhoto);

        await uploadTask;

        // Get the download URL of the uploaded image
        photoURL = await getDownloadURL(storageRef);
        toast("Profile photo uploaded successfully!");
      } catch (error) {
        console.error("Error uploading profile photo:", error);
        toast("Failed to upload profile photo.");
        setIsLoading(false);
        return;
      }
    }

    // Update user profile in Firestore
    try {
      const userDocRef = doc(db, "users", currentUserId);
      await updateDoc(userDocRef, {
        displayName: name,
        department,
        phone,
        position,
        photoURL, // Update photo URL in Firestore
        updatedAt: new Date(), // Optional: Update timestamp of the last profile update
      });

      toast("Profile updated successfully!");
      setIsOpen(false); // Close the dialog after saving
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
            <Avatar className="w-20 h-20">
              <AvatarImage src={imagePreview || profilePhotoURL} />
              <AvatarFallback>GP</AvatarFallback>
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
