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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Users,
  Search,
  Mail,
  UserPlus,
  Loader2,
  ContactRound,
} from "lucide-react";
import { useMessageActionStore } from "@/stores/useMessageActionStore";

export function CreateGroupChat({
  currentUserId,
  submitText,
  onSubmit,
  isLoading,
}) {
  const { chats, users } = useMessageActionStore();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Search functionality states
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [contactsSearch, setContactsSearch] = useState("");

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
        resetForm();
        setIsOpen(false);
      } catch (error) {
        console.error("Error creating group:", error);
      }
    }
  };

  const resetForm = () => {
    setGroupName("");
    setSelectedUsers([]);
    setSearchEmail("");
    setSearchResults([]);
    setSearchError("");
    setContactsSearch("");
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  // Search user by email in Zustand store
  const handleSearchByEmail = () => {
    if (!searchEmail.trim()) {
      setSearchError("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(searchEmail)) {
      setSearchError("Please enter a valid email address");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    // Simulate a small delay for better UX (optional)
    setTimeout(() => {
      const searchEmailLower = searchEmail.toLowerCase().trim();

      // Search through users in Zustand store
      const foundUsers = users.filter(
        (user) =>
          user.email?.toLowerCase() === searchEmailLower &&
          user.id !== currentUserId
      );

      if (foundUsers.length === 0) {
        // Check if it's the current user's email
        const isCurrentUserEmail = users.some(
          (user) =>
            user.email?.toLowerCase() === searchEmailLower &&
            user.id === currentUserId
        );

        if (isCurrentUserEmail) {
          setSearchError("This is your own email address");
        } else {
          setSearchError("No user found with this email address");
        }
        setSearchResults([]);
      } else {
        setSearchResults(foundUsers);
        setSearchError("");
      }

      setIsSearching(false);
    }, 300); // Small delay to show loading state
  };

  // Get users you've chatted with from direct chats
  const getChatContacts = () => {
    if (!chats || !Array.isArray(chats)) return [];

    const chatUserIds = new Set();

    chats
      .filter(
        (chat) => chat.type === "direct" && chat.users?.includes(currentUserId)
      )
      .forEach((chat) => {
        const otherUserId = chat.users.find(
          (userId) => userId !== currentUserId
        );
        if (otherUserId) {
          chatUserIds.add(otherUserId);
        }
      });

    return users.filter((user) => chatUserIds.has(user.id));
  };

  // Filter contacts based on search
  const filteredContacts = getChatContacts().filter(
    (u) =>
      u.displayName?.toLowerCase().includes(contactsSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(contactsSearch.toLowerCase())
  );

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchByEmail();
    }
  };

  const isSubmitDisabled =
    !groupName.trim() || selectedUsers.length === 0 || isLoading;

  const renderUserItem = (user, source = "contact") => {
    const isSelected = selectedUsers.includes(user.id);

    return (
      <div
        key={`${source}-${user.id}`}
        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
          isSelected
            ? "bg-blue-50 border-blue-200"
            : "hover:bg-gray-50 hover:dark:bg-gray-700 border-gray-200"
        } ${
          source === "search"
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : ""
        }`}
        onClick={() => handleUserSelection(user.id, !isSelected)}
      >
        <Checkbox
          checked={isSelected}
          onChange={(checked) => handleUserSelection(user.id, checked)}
          disabled={isLoading}
        />
        <Avatar className="w-10 h-10 flex-shrink-0">
          {user?.photoURL ? (
            <AvatarImage src={user?.photoURL} alt={user?.displayName} />
          ) : (
            <AvatarFallback>
              {user?.displayName?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium capitalize text-sm truncate">
            {user?.displayName || "Unknown User"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user?.email}
          </p>
          {user?.department && (
            <p className="text-xs text-blue-600">{user?.department}</p>
          )}
        </div>
        {isSelected && (
          <Icon
            icon="material-symbols:check-circle"
            className="text-blue-500 flex-shrink-0"
            width="20"
            height="20"
          />
        )}
        {source === "search" && !isSelected && (
          <span className="text-xs text-green-600 font-medium flex-shrink-0">
            New
          </span>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full mb-1 flex justify-start gap-4 items-center"
        >
          <Users />
          New Group
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[85vh] h-[700px] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Group
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 px-6">
          {/* Group Name Field */}
          <div className="flex-shrink-0 mb-4">
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
            <div className="flex-shrink-0 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedUsers.length} user(s) selected
              </p>
            </div>
          )}

          <Tabs defaultValue="contacts" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mb-4">
              <TabsTrigger
                value="contacts"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <ContactRound className="h-4 w-4" />
                <span>Contacts</span>
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span>Search Users</span>
              </TabsTrigger>
            </TabsList>

            {/* Contacts Tab */}
            <TabsContent
              value="contacts"
              className="flex-1 flex flex-col mt-0 data-[state=active]:flex"
            >
              <div className="flex-shrink-0 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search contacts..."
                    value={contactsSearch}
                    onChange={(e) => setContactsSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                {filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ContactRound className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium mb-1 text-sm">
                      {contactsSearch ? "No contacts found" : "No contacts yet"}
                    </p>
                    <p className="text-xs text-gray-400 px-4">
                      {contactsSearch
                        ? "Try adjusting your search terms"
                        : "Add contacts by searching their email"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32">
                    {filteredContacts.map((user) =>
                      renderUserItem(user, "contact")
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Search Users Tab */}
            <TabsContent
              value="search"
              className="flex-1 flex flex-col mt-0 data-[state=active]:flex"
            >
              <div className="flex-shrink-0">
                <div className="space-y-2">
                  <div>
                    <Label
                      htmlFor="search-email"
                      className="text-sm font-medium"
                    >
                      Email Address
                    </Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search-email"
                        type="email"
                        placeholder="Enter email address..."
                        value={searchEmail}
                        onChange={(e) => {
                          setSearchEmail(e.target.value);
                          setSearchError("");
                        }}
                        onKeyPress={handleKeyPress}
                        className="pl-10"
                        disabled={isSearching}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSearchByEmail}
                    disabled={isSearching || !searchEmail.trim()}
                    className="w-full"
                    size="sm"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search User
                      </>
                    )}
                  </Button>
                </div>

                {searchError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mt-3">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {searchError}
                    </p>
                  </div>
                )}
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto min-h-0 mt-4 pr-2 -mr-2">
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Search Results
                    </h4>
                    {searchResults.map((user) =>
                      renderUserItem(user, "search")
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4 px-6 pb-6 gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading} size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            type="submit"
            disabled={isSubmitDisabled}
            size="sm"
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
