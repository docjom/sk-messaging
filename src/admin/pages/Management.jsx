import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

import { toast, Toaster } from "sonner";
import { Input } from "@/components/ui/input";
import { AddUserDialog } from "../components/AddUserDialog";
import { Button } from "@/components/ui/button";
import { ShieldBan, ShieldCheck, Trash, Pencil } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Management = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

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
    { value: "admin", label: "Admin" },
  ];

  // Pagination states per section
  const perPage = 5;
  const [pageActive, setPageActive] = useState(1);
  const [pageBlocked, setPageBlocked] = useState(1);
  const [pageDeleted, setPageDeleted] = useState(1);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      //  console.log("Users data:", data); // Check what fields exist
      setUsers(data);
    });
    return () => unsub();
  }, []);

  const normalizedSearch = (search || "").trim().toLowerCase();

  const { activeUsers, blockedUsers, deletedUsers } = users.reduce(
    (acc, u) => {
      const name = (u.displayName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();

      // Match if search is empty OR matches either name or email
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

  // Pagination helper
  const paginate = (arr, page) =>
    arr.slice((page - 1) * perPage, page * perPage);
  const totalPages = (arr) => Math.ceil(arr.length / perPage) || 1;

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

  const renderTable = (data, page, setPage, statusLabel) => (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-left">
        <thead>
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginate(data, page).map((user) => (
            <tr key={user.id} className="border-t">
              <td className="p-2">{user.displayName}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2">
                <div className="flex justify-start items-center gap-2">
                  {user.blocked ? (
                    <ShieldBan size={20} className="text-red-500" />
                  ) : (
                    <ShieldCheck size={20} className="text-green-500" />
                  )}
                  {statusLabel === "Deleted" && (
                    <Trash size={16} className="text-red-500" />
                  )}
                </div>
              </td>
              <td className="p-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditUser(user);
                      setEditEmail(user.email || "");
                      setEditRole(user.role || "");
                      setIsEditOpen(true);
                    }}
                  >
                    <Pencil size={16} />
                    Edit
                  </Button>

                  {statusLabel !== "Deleted" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant={user.blocked ? "outline" : "destructive"}
                        >
                          <ShieldBan size={16} />
                          {user.blocked ? "Unblock" : "Block"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {user.blocked ? "Unblock" : "Block"} this user?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {user.blocked ? (
                              <>
                                This will allow{" "}
                                <strong>{user.displayName}</strong> to access
                                the application again. They will be able to sign
                                in and use all features normally.
                              </>
                            ) : (
                              <>
                                This will prevent{" "}
                                <strong>{user.displayName}</strong> from
                                accessing the application. They will not be able
                                to sign in or use any features until unblocked.
                              </>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleBlock(user.id, user.blocked)}
                            className={
                              user.blocked ? "" : "bg-red-600 hover:bg-red-700"
                            }
                          >
                            {user.blocked ? "Unblock User" : "Block User"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {statusLabel !== "Deleted" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash size={16} />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will mark{" "}
                            <strong>{user.displayName}</strong> as deleted. You
                            can view deleted users in the "Deleted Users"
                            section.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-wrap justify-between items-center p-2">
        <div>
          Page {page} of {totalPages(data)}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalPages(data) }, (_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Toaster />
      <div className="p-4 w-full space-y-6">
        <h2 className="text-xl font-bold">User Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent className="text-4xl font-bold">
              {activeUsers.length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Blocked Users</CardTitle>
            </CardHeader>
            <CardContent className="text-4xl font-bold">
              {blockedUsers.length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Deleted Users</CardTitle>
            </CardHeader>
            <CardContent className="text-4xl font-bold">
              {deletedUsers.length}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end items-center gap-2">
          <div className="flex gap-4">
            <div>
              <Input
                placeholder="Search user by name or email..."
                value={search}
                type="text"
                autoComplete="off"
                onChange={(e) => setSearch(e.target.value)}
                className="w-52"
              />
            </div>
            <div>
              <AddUserDialog />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold">Active Users</h2>
        {renderTable(activeUsers, pageActive, setPageActive, "Active")}

        <h2 className="text-xl font-bold">Blocked Users</h2>
        {renderTable(blockedUsers, pageBlocked, setPageBlocked, "Blocked")}

        <h2 className="text-xl font-bold">Deleted Users</h2>
        {renderTable(deletedUsers, pageDeleted, setPageDeleted, "Deleted")}
      </div>

      <Dialog open={isEditOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Email"
                type="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClick}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update <strong>{editUser?.displayName}</strong>'s
              information:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className=" p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Email:</span> {editEmail}
              </div>
              <div>
                <span className="font-medium">Role:</span>{" "}
                {roleOptions.find((r) => r.value === editRole)?.label ||
                  editRole}
              </div>
            </div>
          </div>
          Are you sure you want to save these changes?
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditSave}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
