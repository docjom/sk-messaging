import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, CirclePlus, Plus, Minus, Check } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar } from "../ui/avatar";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { useUserStore } from "@/stores/useUserStore";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

export const AddAdmin = () => {
  const { chatId } = useMessageActionStore();
  const { user } = useUserStore();

  const [chatData, setChatData] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});

  const fetchUserDetails = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserDetails((prev) => ({
          ...prev,
          [userId]: {
            name: userData.displayName || "Unknown",
            avatar: userData.photoURL || "",
            email: userData.email || "",
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchChatData = async () => {
    try {
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      if (!chatDoc.exists()) {
        console.error("Chat document does not exist");
        return;
      }

      const data = chatDoc.data();
      setChatData(data);

      // Fetch details for all users in the chat
      const allUsers = data.users || [];
      await Promise.all(allUsers.map(fetchUserDetails));
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  };

  const getUserDetails = (userId) => {
    return userDetails[userId] || { name: "Loading...", avatar: "", email: "" };
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      setUpdatingUser(userId);

      // Update the user role in Firestore
      await updateDoc(doc(db, "chats", chatId), {
        [`userRoles.${userId}`]: newRole,
      });

      // Update local state
      setChatData((prev) => ({
        ...prev,
        userRoles: {
          ...prev.userRoles,
          [userId]: newRole,
        },
      }));

      const userDetails = getUserDetails(userId);
      const action =
        newRole === "admin" ? "promoted to admin" : "demoted to member";
      toast.success(`${userDetails.name} has been ${action}`);

      console.log(`Updated ${userId} to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    } finally {
      setUpdatingUser(null);
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchChatData();
    }
  }, [chatId]);

  if (!chatData) return null;

  const currentUserRole = chatData.userRoles?.[user?.uid];
  const canManageAdmins = currentUserRole === "admin";

  // Get users with their roles
  const usersWithRoles = (chatData.users || []).map((userId) => ({
    userId,
    role: chatData.userRoles?.[userId] || "member",
  }));

  const admins = usersWithRoles.filter((user) => user.role === "admin");
  const members = usersWithRoles.filter((user) => user.role === "member");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={"ghost"}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="flex w-full justify-start"
        >
          <Shield />
          Administrators
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield />
            Administrators
          </DialogTitle>
        </DialogHeader>

        {/* Current Admins */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm">Current Administrators</h3>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No administrators found
            </p>
          ) : (
            admins.map(({ userId: adminId }) => {
              const userDetail = getUserDetails(adminId);
              return (
                <div key={adminId} className="p-2 border  hover:bg-gray-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={userDetail.avatar} />
                        <AvatarFallback>
                          {userDetail.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{userDetail.name}</p>
                        <p className="text-xs text-muted-foreground">Admin</p>
                      </div>
                    </div>
                    {canManageAdmins &&
                      adminId !== user?.uid &&
                      admins.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserRole(adminId, "member")}
                          disabled={updatingUser === adminId}
                          className="text-red-600 hover:text-red-700"
                        >
                          {updatingUser === adminId ? (
                            <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Minus size={16} />
                          )}
                        </Button>
                      )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Admins */}
        {canManageAdmins && members.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-2 font-semibold text-sm items-center">
              <CirclePlus />
              Promote Members to Admin
            </div>

            <div className=" max-h-40 overflow-y-auto border">
              {members.map(({ userId: memberId }) => {
                const userDetail = getUserDetails(memberId);
                return (
                  <div
                    key={memberId}
                    className="border-b last:border-0 p-2 hover:bg-gray-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={userDetail.avatar} />
                          <AvatarFallback></AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="text-sm font-medium">
                            {userDetail.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Member
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => updateUserRole(memberId, "admin")}
                        disabled={updatingUser === memberId}
                      >
                        {updatingUser === memberId ? (
                          <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Plus size={16} />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!canManageAdmins && (
          <div className="p-3 bg-yellow-50 dark:bg-transparent border  rounded text-sm text-yellow-800 dark:text-white">
            You need admin privileges to manage administrators.
          </div>
        )}

        {members.length === 0 && canManageAdmins && (
          <div className="p-3 bg-blue-50 dark:bg-transparent border border-blue-200 dark:border-gray-500 rounded text-sm text-blue-800 dark:text-white">
            All users are already administrators.
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
              }}
              type="button"
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
