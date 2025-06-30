import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

export function AddUsersToGroup({
  users,
  currentUserId,
  currentChat,
  submitText,
  onSubmit,
  isLoading,
}) {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Filter users who are not already in the group
  const availableUsers = users.filter(
    (user) =>
      user.id !== currentUserId && !currentChat?.users?.includes(user.id)
  );

  const handleUserSelection = (userId, isChecked) => {
    setSelectedUsers((prev) => {
      if (isChecked) {
        return [...prev, userId];
      } else {
        return prev.filter((id) => id !== userId);
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedUsers.length > 0) {
      try {
        await onSubmit(selectedUsers);
        // Reset form on success
        setSelectedUsers([]);
        setIsOpen(false);
      } catch (error) {
        console.error("Error adding users:", error);
      }
    }
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      // Reset selection when dialog closes
      setSelectedUsers([]);
    }
  };

  const isSubmitDisabled = selectedUsers.length === 0 || isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="border flex justify-start rounded-full"
        >
          <Icon icon="solar:widget-add-broken" width="20" height="20" /> Add
          user
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Members to Group</DialogTitle>
        </DialogHeader>

        {/* Show selected count */}
        {selectedUsers.length > 0 && (
          <div className=" p-2 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              {selectedUsers.length} user(s) selected
            </p>
          </div>
        )}

        {/* Available users list */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {availableUsers.length > 0 ? (
            availableUsers.map((user) => {
              const isSelected = selectedUsers.includes(user.id);
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                    isSelected
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                  onClick={() => handleUserSelection(user.id, !isSelected)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={(checked) =>
                      handleUserSelection(user.id, checked)
                    }
                    disabled={isLoading}
                  />
                  <Avatar className="w-10 h-10">
                    {user?.photoURL ? (
                      <AvatarImage
                        src={user?.photoURL}
                        alt={user?.displayName}
                      />
                    ) : (
                      <AvatarFallback>
                        {user?.displayName?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 max-w-96 overflow-hidden truncate">
                    <p className="font-medium capitalize truncate max-w-96  text-sm">
                      {user?.displayName || "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-96">
                      {user?.email}
                    </p>
                    {user?.department && (
                      <p className="text-xs text-blue-600">
                        {user?.department}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Icon
                      icon="material-symbols:check-circle"
                      className="text-blue-500"
                      width="20"
                      height="20"
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Icon
                icon="solar:users-group-two-rounded-linear"
                width="48"
                height="48"
                className="mx-auto mb-2 text-gray-300"
              />
              <p>All users are already in this group</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline" type="button" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            type="submit"
            disabled={isSubmitDisabled}
          >
            {isLoading && (
              <Icon
                icon="line-md:loading-alt-loop"
                width="16"
                height="16"
                className="mr-2"
              />
            )}
            {submitText || "Add Members"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
