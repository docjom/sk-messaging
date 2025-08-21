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
import { UserPen, Key, Camera, Upload } from "lucide-react";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { useUserStore } from "@/stores/useUserStore";
import { Roles } from "@/scripts/roles";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";

export function EditProfile({ currentUserId }) {
  const { userProfile } = useUserStore();
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

  const canEditRoleFields =
    userProfile?.role === Roles.ADMIN ||
    userProfile?.role === Roles.HR ||
    userProfile?.role === Roles.SUPER_ADMIN;

  return (
    <>
      {/* Edit Profile Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 hover:bg-accent/50 transition-colors"
          >
            <UserPen />
            <span>Manage Profile</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl">Edit Profile</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update your profile information and click save when you're done.
              </DialogDescription>
            </DialogHeader>

            {profileErrors.general && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-destructive text-sm font-medium">
                  {profileErrors.general}
                </p>
              </div>
            )}

            {/* Avatar Section */}
            <Card className="border border-border/50">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-border shadow-lg">
                      <AvatarImage
                        src={imagePreview || profilePhotoURL}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xl bg-muted">
                        {name[0]?.toUpperCase() || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    type="button"
                    className="gap-2 hover:bg-accent"
                    size="sm"
                  >
                    <Upload className="h-4 w-4" />
                    <label htmlFor="profile-photo" className="cursor-pointer">
                      Change Photo
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
              </CardContent>
            </Card>

            <Separator />

            {/* Form Fields */}
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-11"
                />
                {profileErrors.name && (
                  <p className="text-destructive text-sm font-medium">
                    {profileErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department
                    {!canEditRoleFields && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (Read-only)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="department"
                    value={department}
                    disabled={!canEditRoleFields}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Engineering"
                    className="h-11"
                  />
                  {profileErrors.department && (
                    <p className="text-destructive text-sm font-medium">
                      {profileErrors.department}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium">
                    Position
                    {!canEditRoleFields && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (Read-only)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="position"
                    value={position}
                    disabled={!canEditRoleFields}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Software Developer"
                    className="h-11"
                  />
                  {profileErrors.position && (
                    <p className="text-destructive text-sm font-medium">
                      {profileErrors.position}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  type="tel"
                  className="h-11"
                />
                {profileErrors.phone && (
                  <p className="text-destructive text-sm font-medium">
                    {profileErrors.phone}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-3 pt-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isLoading}
                  className="px-6"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading} className="px-6">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPwOpen} onOpenChange={setIsPwOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 hover:bg-accent/50 transition-colors"
          >
            <Key />
            <span>Change Password</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleChangePassword} className="space-y-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl">Change Password</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter your current password and choose a new secure password.
              </DialogDescription>
            </DialogHeader>

            {pwErrors.general && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-destructive text-sm font-medium">
                  {pwErrors.general}
                </p>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="current-password"
                  className="text-sm font-medium"
                >
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="h-11"
                />
                {pwErrors.currentPassword && (
                  <p className="text-destructive text-sm font-medium">
                    {pwErrors.currentPassword}
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="h-11"
                />
                {pwErrors.newPassword && (
                  <p className="text-destructive text-sm font-medium">
                    {pwErrors.newPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-medium"
                >
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-11"
                />
                {pwErrors.confirmPassword && (
                  <p className="text-destructive text-sm font-medium">
                    {pwErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-3 pt-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isPwLoading}
                  className="px-6"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPwLoading} className="px-6">
                {isPwLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
