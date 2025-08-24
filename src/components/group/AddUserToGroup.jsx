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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Mail, Search, Loader2, Users, Check } from "lucide-react";

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

  // Contact search states
  const [contactsSearch, setContactsSearch] = useState("");

  // Email search states
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Filter users who are not already in the group
  const availableUsers = users.filter(
    (user) =>
      user.id !== currentUserId && !currentChat?.users?.includes(user.id)
  );

  // Filter available users based on search
  const filteredContacts = availableUsers.filter(
    (user) =>
      user.displayName?.toLowerCase().includes(contactsSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(contactsSearch.toLowerCase())
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

  const handleSearchByEmail = async () => {
    if (!searchEmail.trim()) {
      setSearchError("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(searchEmail)) {
      setSearchError("Please enter a valid email address");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

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
    }, 300);
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
      // Reset all states when dialog closes
      setSelectedUsers([]);
      setContactsSearch("");
      setSearchEmail("");
      setSearchResults([]);
      setSearchError("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchByEmail();
    }
  };

  const isSubmitDisabled = selectedUsers.length === 0 || isLoading;

  const renderUserItem = (user, isFromSearch = false) => {
    const isSelected = selectedUsers.includes(user.id);
    return (
      <div
        key={user.id}
        className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
          isSelected
            ? "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 shadow-sm"
            : isFromSearch
            ? "hover:bg-green-50 hover:dark:bg-green-950/30 border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20 hover:shadow-sm"
            : "hover:bg-gray-50 hover:dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
        }`}
        onClick={() => handleUserSelection(user.id, !isSelected)}
      >
        <Checkbox
          checked={isSelected}
          onChange={(checked) => handleUserSelection(user.id, checked)}
          disabled={isLoading}
          className="shrink-0"
        />

        <Avatar className="w-11 h-11 shrink-0 ring-2 ring-transparent group-hover:ring-gray-200 dark:group-hover:ring-gray-700 transition-all duration-200">
          {user?.photoURL ? (
            <AvatarImage src={user?.photoURL} alt={user?.displayName} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
              {user?.displayName?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-medium text-gray-900 dark:text-gray-100 capitalize truncate">
            {user?.displayName || "Unknown User"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {user?.email}
          </p>
          {user?.department && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {user?.department}
            </span>
          )}
        </div>

        {isSelected && (
          <div className="shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 h-auto py-2.5 rounded-full px-4 border transition-all duration-200"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Add Members</span>
          <span className="sm:hidden font-medium">Add</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[85vh] h-[700px] flex flex-col p-0 gap-0 rounded-2xl border-2">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/50 rounded-lg flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="truncate">Add Members to Group</span>
          </DialogTitle>
        </DialogHeader>

        {/* Selected count badge */}
        {selectedUsers.length > 0 && (
          <div className="flex-shrink-0 mx-4 sm:mx-6 mt-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {selectedUsers.length}
              </div>
              <p className="font-medium text-blue-800 dark:text-blue-200 truncate">
                {selectedUsers.length} user
                {selectedUsers.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 mt-4">
          <Tabs defaultValue="contacts" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mb-3 sm:mb-4 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs sm:text-sm">
              <TabsTrigger
                value="contacts"
                className="flex items-center gap-1 sm:gap-2 font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Available Users</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="flex items-center gap-1 sm:gap-2 font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search by Email</span>
                <span className="sm:hidden">Search</span>
              </TabsTrigger>
            </TabsList>

            {/* Available Users Tab */}
            <TabsContent
              value="contacts"
              className="flex-1 flex flex-col mt-0 data-[state=active]:flex space-y-3 sm:space-y-4"
            >
              <div className="flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search available users..."
                    value={contactsSearch}
                    onChange={(e) => setContactsSearch(e.target.value)}
                    className="pl-10 h-10 sm:h-11 rounded-xl border-2 focus:border-blue-300 dark:focus:border-blue-700 transition-colors duration-200 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto  pr-1 sm:pr-2 -mr-1 sm:-mr-2 space-y-2">
                {filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                      <Users className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">
                      {contactsSearch
                        ? "No users found"
                        : availableUsers.length === 0
                        ? "All users are already in this group"
                        : "No available users"}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-3 sm:px-4 max-w-sm">
                      {contactsSearch
                        ? "Try adjusting your search terms or search by email to find more users"
                        : "Search by email to find and add external users"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32">
                    {filteredContacts.map((user) => renderUserItem(user))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Search by Email Tab */}
            <TabsContent
              value="search"
              className="flex-1 flex flex-col mt-0 data-[state=active]:flex space-y-4"
            >
              <div className="flex-shrink-0 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="search-email"
                      className="font-medium text-gray-900 dark:text-gray-100"
                    >
                      Email Address
                    </Label>
                    <div className="relative mt-2">
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
                        className="pl-10 h-11 rounded-xl border-2 focus:border-green-300 dark:focus:border-green-700 transition-colors duration-200"
                        disabled={isSearching}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSearchByEmail}
                    disabled={isSearching || !searchEmail.trim()}
                    className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors duration-200"
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
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                      {searchError}
                    </p>
                  </div>
                )}
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto  min-h-0 pr-2 -mr-2">
                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-3">
                        Search Results
                      </span>
                      <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                    </div>
                    <div className="space-y-2">
                      {searchResults.map((user) => renderUserItem(user, true))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 px-4 sm:px-6 pb-5 sm:pb-6 flex flex-col sm:flex-row gap-2 sm:gap-3 border-t border-gray-100 dark:border-gray-800 pt-5 sm:pt-6">
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={isLoading}
              className="w-full sm:flex-none sm:w-auto h-11 rounded-xl border-2 font-medium transition-colors duration-200"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full sm:flex-none sm:w-auto h-11 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitText ||
              `Add ${
                selectedUsers.length > 0 ? `${selectedUsers.length} ` : ""
              }Member${selectedUsers.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
