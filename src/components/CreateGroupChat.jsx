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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function CreateGroupChat({
  users,
  currentUserId,
  submitText,
  onSubmit,
  isLoading,
}) {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleUserSelection = (userId, isChecked) => {
    setSelectedUsers((prevSelected) => {
      if (isChecked) {
        return [...prevSelected, userId];
      } else {
        return prevSelected.filter((id) => id !== userId);
      }
    });
  };

  const handleSubmit = async () => {
    if (groupName.trim() && selectedUsers.length > 0) {
      try {
        await onSubmit(groupName.trim(), selectedUsers);
        // Reset form on success
        setGroupName("");
        setSelectedUsers([]);
        setIsOpen(false);
      } catch (error) {
        console.error("Error creating group:", error);
      }
    }
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setGroupName("");
      setSelectedUsers([]);
    }
  };

  const isSubmitDisabled = !groupName.trim() || selectedUsers.length === 0 || isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full mb-1 flex justify-start gap-4 items-center"
        >
         <Icon icon="solar:users-group-rounded-linear" width="24" height="24" />
          New Group
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>

        {/* Group Name Field */}
        <div className="mb-4">
          <Label htmlFor="group-name" className="mb-2 block">
            Group Name *
          </Label>
          <Input
            id="group-name"
            placeholder="Enter group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Selected Users Count */}
        {selectedUsers.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              {selectedUsers.length} user(s) selected
            </p>
          </div>
        )}

        {/* List of Users */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <Label className="text-sm font-medium">Select Members *</Label>
          {users
            .filter((u) => u.id !== currentUserId) // Exclude current user
            .map((u) => {
              const isSelected = selectedUsers.includes(u.id);
              return (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                    isSelected
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                  onClick={() => handleUserSelection(u.id, !isSelected)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={(checked) => handleUserSelection(u.id, checked)}
                    disabled={isLoading}
                  />
                  <Avatar className="w-10 h-10">
                    {u?.photoURL ? (
                      <AvatarImage src={u?.photoURL} alt={u?.displayName} />
                    ) : (
                      <AvatarFallback>
                        {u?.displayName?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium capitalize text-sm">
                      {u?.displayName || "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500">{u?.email}</p>
                    {u?.department && (
                      <p className="text-xs text-blue-600">{u?.department}</p>
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
            })}
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
            {submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}