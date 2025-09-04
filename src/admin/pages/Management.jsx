import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { toast, Toaster } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUserStore } from "@/stores/useUserStore";
import {
  Users,
  Trash2,
  Pencil,
  Search,
  ShieldCheck,
  ShieldBan,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddUserDialog } from "../components/AddUserDialog";
import { Roles } from "@/scripts/roles";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import getUserMessages from "../hooks/useUserMessages";
import { MessagesDialog } from "../components/MessageDialog";

export const Management = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { userProfile } = useUserStore();

  // Edit Dialog state
  const [editUser, setEditUser] = useState(null);
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  // Role options
  const roleOptions = [
    { value: "user", label: "User" },
    { value: "hr", label: "HR" },
    { value: "manager", label: "Manager" },
    { value: "admin", label: "Administrator" },
    { value: "boss", label: "Boss" },
    { value: "super_admin", label: "Super Administrator" },
  ];

  let availableRoleOptions = [];

  if (userProfile?.role === Roles.HR) {
    // HR can only assign User, Manager or HR
    availableRoleOptions = roleOptions.filter((role) =>
      ["user", "hr", "manager"].includes(role.value)
    );
  } else if (userProfile?.role === Roles.ADMIN) {
    // Admin can assign User, HR, Manager or Admin
    availableRoleOptions = roleOptions.filter((role) =>
      ["user", "hr", "manager", "admin"].includes(role.value)
    );
  } else if (userProfile?.role === Roles.BOSS) {
    availableRoleOptions = roleOptions.filter((role) =>
      ["user", "hr", "manager", "admin", "boss"].includes(role.value)
    );
  } else if (userProfile?.role === Roles.SUPER_ADMIN) {
    // Super Admin can assign any role
    availableRoleOptions = roleOptions;
  } else {
    // Default fallback (normal users, etc.)
    availableRoleOptions = roleOptions.filter((role) => role.value === "user");
  }

  // Pagination states per section
  const perPage = 5;
  const [pageActive, setPageActive] = useState(1);
  const [pageBlocked, setPageBlocked] = useState(1);
  const [pageDeleted, setPageDeleted] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Firebase listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(data);
    });
    return () => unsub();
  }, []);

  const normalizedSearch = (search || "").trim().toLowerCase();

  // Categorize users with search filtering
  const { activeUsers, blockedUsers, deletedUsers } = users.reduce(
    (acc, u) => {
      // ❌ hide super_admin from non-super admins
      if (
        userProfile?.role !== Roles.SUPER_ADMIN &&
        u.role === Roles.SUPER_ADMIN
      ) {
        return acc;
      }

      const name = (u.displayName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch);

      if (!matchesSearch) return acc;

      if (u.deleted === "deleted") {
        acc.deletedUsers.push(u);
      } else if (u.blocked) {
        acc.blockedUsers.push(u);
      } else {
        acc.activeUsers.push(u);
      }

      return acc;
    },
    { activeUsers: [], blockedUsers: [], deletedUsers: [] }
  );

  // Get filtered users based on current tab
  const getFilteredUsers = () => {
    switch (activeTab) {
      case "active":
        return activeUsers;
      case "blocked":
        return blockedUsers;
      case "deleted":
        return deletedUsers;
      default:
        return [...activeUsers, ...blockedUsers];
    }
  };

  const filteredUsers = getFilteredUsers();

  // Pagination helper
  const paginate = (arr, page) =>
    arr.slice((page - 1) * perPage, page * perPage);
  const totalPages = (arr) => Math.ceil(arr.length / perPage) || 1;

  // Get current page based on active tab
  const getCurrentPage = () => {
    switch (activeTab) {
      case "active":
        return pageActive;
      case "blocked":
        return pageBlocked;
      case "deleted":
        return pageDeleted;
      default:
        return currentPage;
    }
  };

  const setCurrentPageForTab = (page) => {
    switch (activeTab) {
      case "active":
        setPageActive(page);
        break;
      case "blocked":
        setPageBlocked(page);
        break;
      case "deleted":
        setPageDeleted(page);
        break;
      default:
        setCurrentPage(page);
    }
  };

  const paginatedUsers = paginate(filteredUsers, getCurrentPage());
  const totalPagesForCurrentTab = totalPages(filteredUsers);

  // Actions
  const handleBlock = async (id, blocked) => {
    try {
      await updateDoc(doc(db, "users", id), { blocked: !blocked });
      toast.success(blocked ? "User unblocked" : "User blocked");
    } catch (error) {
      toast.error("Failed to update user");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await updateDoc(doc(db, "users", id), { deleted: "deleted" });
      toast.success("User deleted");
    } catch (error) {
      toast.error("Failed to delete user");
      console.error(error);
    }
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    try {
      await updateDoc(doc(db, "users", editUser.id), {
        email: editEmail,
        role: editRole,
      });
      toast.success("User updated successfully");
      setEditUser(null);
      setIsEditOpen(false);
      setIsSaveConfirmOpen(false);
    } catch (error) {
      toast.error("Failed to update user");
      console.error(error);
    }
  };

  const handleSaveClick = () => {
    setIsSaveConfirmOpen(true);
  };

  const handleEditOpenChange = (open) => {
    setIsEditOpen(open);
    if (!open) {
      setEditUser(null);
      setEditEmail("");
      setEditRole("");
      setIsSaveConfirmOpen(false);
    }
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setEditEmail(user.email || "");
    setEditRole(user.role || "");
    setIsEditOpen(true);
  };

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPageForTab(1);
  }, [activeTab]);

  const stats = [
    {
      title: "Active Users",
      value: activeUsers.length,
      icon: Users,
      description: "Currently active",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Blocked Users",
      value: blockedUsers.length,
      icon: ShieldBan,
      description: "Temporarily blocked",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Deleted Users",
      value: deletedUsers.length,
      icon: Trash2,
      description: "Marked as deleted",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  const canDelete = (currentUser, targetUser) => {
    if (!currentUser || !targetUser) return false;

    // ❌ prevent deleting yourself
    if (currentUser.role === targetUser.role) return false;

    // super admin can delete anyone (except self)
    if (currentUser.role === Roles.SUPER_ADMIN) return true;

    if (currentUser.role === Roles.BOSS) return true;

    // admin can delete but NOT super admin and boss
    if (
      currentUser.role === Roles.ADMIN &&
      (targetUser.role !== Roles.SUPER_ADMIN || targetUser.role !== Roles.BOSS)
    ) {
      return true;
    }

    if (
      currentUser.role === Roles.HR &&
      targetUser.role !== Roles.SUPER_ADMIN &&
      targetUser.role !== Roles.BOSS &&
      targetUser.role !== Roles.ADMIN
    ) {
      return true;
    }

    return false;
  };

  const canEdit = (currentUser, targetUser) => {
    if (!currentUser || !targetUser) return false;

    if (currentUser.role === targetUser.role) {
      return false;
    }

    // cannot edit self
    if (currentUser.id === targetUser.id) return false;

    // super admin can edit anyone (except self)
    if (currentUser.role === Roles.SUPER_ADMIN) {
      return true;
    }

    if (currentUser.role === Roles.BOSS) {
      return true;
    }

    // admin can edit but NOT super admin
    if (
      currentUser.role === Roles.ADMIN &&
      targetUser.role !== Roles.SUPER_ADMIN
    ) {
      return true;
    }

    // hr can edit only if target is not admin or super admin
    if (
      currentUser.role === Roles.HR &&
      targetUser.role !== Roles.ADMIN &&
      targetUser.role !== Roles.BOSS &&
      targetUser.role !== Roles.SUPER_ADMIN
    ) {
      return true;
    }

    return false;
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUserChats = async (user, e) => {
    e.stopPropagation();

    // console.log("Clicked user:", user);

    // Open dialog and set loading state
    setSelectedUser(user);
    setDialogOpen(true);
    setLoading(true);
    setMessages([]);

    try {
      // Call your message fetcher
      const fetchedMessages = await getUserMessages(user.uid);
      setMessages(fetchedMessages);

      // Log them
      //  console.log("Messages for user:", user.uid, fetchedMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-muted/30 p-4 md:p-6">
        <Toaster />
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-muted-foreground">
                  Manage user accounts, roles, and permissions
                </p>
              </div>

              <AddUserDialog />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div key={stat.title}>
                  <Card className="hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <IconComponent className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                          {stat.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Search and Filters */}
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border my-6"></div>

            {/* Users Table */}
            <motion.div
              className="bg-card rounded-lg border shadow-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="p-6 pb-0">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger
                      value="all"
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:block"> All Users</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="active"
                      className="flex items-center gap-2"
                    >
                      <ShieldCheck className="h-4 w-4" />

                      <span className="hidden sm:block"> Active</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="blocked"
                      className="flex items-center gap-2"
                    >
                      <ShieldBan className="h-4 w-4" />
                      <span className="hidden sm:block"> Blocked</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="deleted"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:block"> Deleted</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-0">
                  <div className="overflow-hidden">
                    {paginatedUsers.length > 0 ? (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left p-4 font-medium text-muted-foreground">
                                  User
                                </th>
                                <th className="text-left p-4 font-medium text-muted-foreground">
                                  Email
                                </th>
                                <th className="text-left p-4 font-medium text-muted-foreground">
                                  Role
                                </th>
                                <th className="text-left p-4 font-medium text-muted-foreground">
                                  Status
                                </th>
                                <th className="text-left p-4 font-medium text-muted-foreground">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedUsers.map((user, index) => (
                                <motion.tr
                                  key={user.id}
                                  className="border-b hover:bg-muted/25 transition-colors"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    delay: index * 0.1,
                                  }}
                                >
                                  <td className="p-4">
                                    <div
                                      onClick={(e) => {
                                        if (
                                          userProfile?.role ===
                                          Roles.SUPER_ADMIN
                                        ) {
                                          handleUserChats(user, e);
                                        }
                                      }}
                                      className="flex items-center gap-3 flex-1 min-w-0 "
                                    >
                                      <Avatar className="w-8 h-8 rounded-full">
                                        <AvatarImage
                                          src={user.photoURL}
                                          className="object-cover rounded-full"
                                        />
                                        <AvatarFallback>
                                          {user.displayName[0]?.toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium truncate">
                                        {user.displayName || "Unknown User"}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="p-4 text-muted-foreground">
                                    {user.email || "No email"}
                                  </td>
                                  <td className="p-4">
                                    <Badge
                                      variant={
                                        user.role === Roles.ADMIN
                                          ? "default"
                                          : user.role === Roles.SUPER_ADMIN
                                          ? "destructive"
                                          : user.role === Roles.BOSS
                                          ? "destructive"
                                          : user.role === Roles.HR
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className="capitalize"
                                    >
                                      {user.role || "user"}
                                    </Badge>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      {user.deleted === "deleted" ? (
                                        <div className="flex items-center gap-2 text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                          <span className="text-sm">
                                            Deleted
                                          </span>
                                        </div>
                                      ) : user.blocked ? (
                                        <div className="flex items-center gap-2 text-orange-500">
                                          <ShieldBan className="h-4 w-4" />
                                          <span className="text-sm">
                                            Blocked
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 text-green-500">
                                          <ShieldCheck className="h-4 w-4" />
                                          <span className="text-sm">
                                            Active
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        disabled={!canEdit(userProfile, user)}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditUser(user)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>

                                      {user.deleted !== "deleted" && (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              disabled={
                                                !canDelete(userProfile, user)
                                              }
                                              variant="ghost"
                                              size="sm"
                                              className={
                                                user.blocked
                                                  ? "text-green-500 hover:text-green-600"
                                                  : "text-orange-500 hover:text-orange-600"
                                              }
                                            >
                                              {user.blocked ? (
                                                <ShieldCheck className="h-4 w-4" />
                                              ) : (
                                                <ShieldBan className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                {user.blocked
                                                  ? "Unblock"
                                                  : "Block"}{" "}
                                                User
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                {user.blocked ? (
                                                  <>
                                                    This will restore access for{" "}
                                                    <strong>
                                                      {user.displayName}
                                                    </strong>
                                                    .
                                                  </>
                                                ) : (
                                                  <>
                                                    This will block access for{" "}
                                                    <strong>
                                                      {user.displayName}
                                                    </strong>
                                                    .
                                                  </>
                                                )}
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Cancel
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  handleBlock(
                                                    user.id,
                                                    user.blocked
                                                  )
                                                }
                                              >
                                                {user.blocked
                                                  ? "Unblock"
                                                  : "Block"}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}

                                      {user.deleted !== "deleted" && (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              disabled={
                                                !canDelete(userProfile, user)
                                              }
                                              variant="ghost"
                                              size="sm"
                                              className="text-destructive hover:text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Delete User
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will mark{" "}
                                                <strong>
                                                  {user.displayName}
                                                </strong>{" "}
                                                as deleted.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Cancel
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  handleDelete(user.id)
                                                }
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {totalPagesForCurrentTab > 1 && (
                          <div className="flex items-center justify-between p-4 border-t bg-muted/25">
                            <div className="text-sm text-muted-foreground">
                              Showing {(getCurrentPage() - 1) * perPage + 1} to{" "}
                              {Math.min(
                                getCurrentPage() * perPage,
                                filteredUsers.length
                              )}{" "}
                              of {filteredUsers.length} users
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPageForTab(
                                    Math.max(1, getCurrentPage() - 1)
                                  )
                                }
                                disabled={getCurrentPage() === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from(
                                  {
                                    length: Math.min(
                                      5,
                                      totalPagesForCurrentTab
                                    ),
                                  },
                                  (_, i) => {
                                    const page = i + 1;
                                    return (
                                      <Button
                                        key={page}
                                        variant={
                                          getCurrentPage() === page
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                          setCurrentPageForTab(page)
                                        }
                                        className="w-8"
                                      >
                                        {page}
                                      </Button>
                                    );
                                  }
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPageForTab(
                                    Math.min(
                                      totalPagesForCurrentTab,
                                      getCurrentPage() + 1
                                    )
                                  )
                                }
                                disabled={
                                  getCurrentPage() === totalPagesForCurrentTab
                                }
                              >
                                Next
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No users found matching your criteria.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Edit User Dialog */}
            <Dialog open={isEditOpen} onOpenChange={handleEditOpenChange}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={editRole} onValueChange={setEditRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleEditOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveClick}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Save Confirmation Dialog */}
            <AlertDialog
              open={isSaveConfirmOpen}
              onOpenChange={setIsSaveConfirmOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to save the changes to this user's
                    profile? This will update their email and role information.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEditSave}>
                    Save Changes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Messages Dialog */}
      <MessagesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        messages={messages}
        loading={loading}
      />
    </>
  );
};
