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
import { UserPen, Key } from "lucide-react";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";

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

  // Inline error states for profile update
  const [profileErrors, setProfileErrors] = useState({});

  // Change password dialog state
  const [isPwOpen, setIsPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPwLoading, setIsPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

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

  const validateProfileForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!department.trim()) errors.department = "Department is required.";
    if (!phone.match(/^\+?[0-9]{10,15}$/))
      errors.phone = "Enter a valid phone number.";
    if (!position.trim()) errors.position = "Position is required.";
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
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
          if (error.code !== "storage/object-not-found") {
            throw error;
          }
        }

        const storageRef = ref(storage, `profilePhotos/${currentUserId}`);
        const uploadTask = uploadBytesResumable(storageRef, newProfilePhoto);
        await uploadTask;
        photoURL = await getDownloadURL(storageRef);
      } catch (e) {
        console.log(e);
        setProfileErrors({ general: "Failed to upload profile photo." });
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
      toast.success("Profile updated successfully!");
      setIsOpen(false);
    } catch {
      setProfileErrors({
        general: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFriendlyPwError = (code) => {
    switch (code) {
      case "auth/wrong-password":
        return "The current password you entered is incorrect.";
      case "auth/weak-password":
        return "Your new password must be at least 6 characters long.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      default:
        return "Failed to change password. Please try again.";
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!currentPassword)
      errors.currentPassword = "Current password is required.";
    if (newPassword.length < 6)
      errors.newPassword = "New password must be at least 6 characters.";
    if (newPassword !== confirmPassword)
      errors.confirmPassword = "New password and confirmation do not match.";
    setPwErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    setIsPwLoading(true);

    const auth = getAuth();
    const user = auth.currentUser;

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast.success("Password updated successfully!");
      setIsPwOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwErrors({});
    } catch (error) {
      setPwErrors({ general: getFriendlyPwError(error.code) });
    } finally {
      setIsPwLoading(false);
    }
  };

  return (
    <>
      {/* Edit Profile */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full mb-1 flex justify-start gap-4 items-center"
          >
            <UserPen /> Manage Profile
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes and click save when done.
              </DialogDescription>
            </DialogHeader>

            {profileErrors.general && (
              <p className="text-red-500 text-sm mb-2">
                {profileErrors.general}
              </p>
            )}

            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-20 h-20 border">
                <AvatarImage src={imagePreview || profilePhotoURL} />
                <AvatarFallback>{name[0]?.toUpperCase() || "P"}</AvatarFallback>
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

            <div className="mb-3">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              {profileErrors.name && (
                <p className="text-red-500 text-sm">{profileErrors.name}</p>
              )}
            </div>

            <div className="mb-3">
              <Label>Department</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              {profileErrors.department && (
                <p className="text-red-500 text-sm">
                  {profileErrors.department}
                </p>
              )}
            </div>

            <div className="mb-3">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              {profileErrors.phone && (
                <p className="text-red-500 text-sm">{profileErrors.phone}</p>
              )}
            </div>

            <div className="mb-3">
              <Label>Position</Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
              {profileErrors.position && (
                <p className="text-red-500 text-sm">{profileErrors.position}</p>
              )}
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

      {/* Change Password */}
      <Dialog open={isPwOpen} onOpenChange={setIsPwOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex justify-start gap-4 items-center"
          >
            <Key /> Change Password
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleChangePassword}>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current and new password.
              </DialogDescription>
            </DialogHeader>

            {pwErrors.general && (
              <p className="text-red-500 text-sm mb-2">{pwErrors.general}</p>
            )}

            <div className="mb-3">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              {pwErrors.currentPassword && (
                <p className="text-red-500 text-sm">
                  {pwErrors.currentPassword}
                </p>
              )}
            </div>

            <div className="mb-3">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {pwErrors.newPassword && (
                <p className="text-red-500 text-sm">{pwErrors.newPassword}</p>
              )}
            </div>

            <div className="mb-3">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {pwErrors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {pwErrors.confirmPassword}
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button" disabled={isPwLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPwLoading}>
                {isPwLoading && (
                  <Icon
                    icon="line-md:loading-alt-loop"
                    width="16"
                    height="16"
                    className="mr-2"
                  />
                )}
                {isPwLoading ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
