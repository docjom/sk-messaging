import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ContactRound,
  UserPlus,
  Mail,
  Search,
  Loader2,
  MessageCircle,
  Users,
} from "lucide-react";
import { db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useMessageActionStore } from "@/stores/useMessageActionStore";

export function Contacts({ users, currentUserId, handleSelectUser }) {
  const { chats } = useMessageActionStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [contactsSearch, setContactsSearch] = useState("");

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

    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", searchEmail.toLowerCase().trim())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSearchError("No user found with this email address");
        setSearchResults([]);
      } else {
        const foundUsers = [];
        querySnapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() };
          // Don't include the current user in search results
          if (userData.id !== currentUserId) {
            foundUsers.push(userData);
          }
        });

        if (foundUsers.length === 0) {
          setSearchError("This is your own email address");
        } else {
          setSearchResults(foundUsers);
        }
      }
    } catch (error) {
      console.error("Error searching for user:", error);
      setSearchError("Failed to search for user. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user) => {
    handleSelectUser(user);
    setIsOpen(false);
    // Reset search state
    setSearchEmail("");
    setSearchResults([]);
    setSearchError("");
    setContactsSearch("");
  };

  // Get users you've chatted with from direct chats
  const getChatContacts = () => {
    if (!chats || !Array.isArray(chats)) return [];

    // Get all user IDs from direct chats
    const chatUserIds = new Set();

    chats
      .filter(
        (chat) => chat.type === "direct" && chat.users?.includes(currentUserId)
      )
      .forEach((chat) => {
        // Add the other user ID (not current user)
        const otherUserId = chat.users.find(
          (userId) => userId !== currentUserId
        );
        if (otherUserId) {
          chatUserIds.add(otherUserId);
        }
      });

    // Return users that match the chat user IDs
    return users.filter((user) => chatUserIds.has(user.id));
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full mb-1 flex justify-start gap-4 items-center"
        >
          <ContactRound />
          Contacts
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[85vh] h-[600px] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <ContactRound className="h-5 w-5" />
            Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 px-6">
          <Tabs defaultValue="contacts" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mb-4">
              <TabsTrigger
                value="contacts"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">My Contacts</span>
                <span className="sm:hidden">Contacts</span>
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Contact</span>
                <span className="sm:hidden">Add</span>
              </TabsTrigger>
            </TabsList>

            {/* My Contacts Tab */}
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

              <div className="flex-1 overflow-y-auto max-h-74 pr-2 -mr-2">
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
                  <div className="space-y-2">
                    {filteredContacts.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
                      >
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={user?.photoURL} />
                          <AvatarFallback className="text-sm font-medium">
                            {user?.displayName?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium capitalize truncate text-sm">
                            {user?.displayName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                        <MessageCircle className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Add Contact Tab */}
            <TabsContent
              value="search"
              className="flex-1 flex flex-col mt-0 data-[state=active]:flex"
            >
              <div className="flex-shrink-0">
                <div className="text-center pb-4">
                  <UserPlus className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 mx-auto " />
                  <h3 className="font-medium text-base sm:text-lg">
                    Add New Contact
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 px-2">
                    Search for users by their email address
                  </p>
                </div>

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
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {searchError}
                    </p>
                  </div>
                )}
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto min-h-0 mt-4 pr-2 -mr-2">
                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Search Results
                    </h4>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      >
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={user?.photoURL} />
                          <AvatarFallback className="text-sm font-medium">
                            {user?.displayName?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium capitalize truncate text-sm">
                            {user?.displayName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <MessageCircle className="h-4 w-4 text-green-600 group-hover:text-green-700 transition-colors" />
                          <span className="text-xs text-green-600 font-medium hidden sm:inline">
                            Start Chat
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4 px-6 pb-6">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
