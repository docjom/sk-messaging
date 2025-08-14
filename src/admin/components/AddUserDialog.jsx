import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { db, app } from "@/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

import { getFunctions, httpsCallable } from "firebase/functions";
import { Pin, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/stores/useUserStore";

export const AddUserDialog = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    position: "",
    department: "",
    phone: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const functions = getFunctions(app, "us-central1");
  const createUserAccount = httpsCallable(functions, "createUserAccount");
  const { userProfile } = useUserStore();

  const handleAddUser = async () => {
    const { name, email, password, role, position, phone, department } = form;

    // Simple regex for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Password strength regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    // Empty fields check
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (userProfile.role === "hr") {
      if (!position.trim()) {
        toast.error("Position is required");
        return;
      }
      if (!department.trim()) {
        toast.error("Department is required");
        return;
      }
    }

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password.trim()) {
      toast.error("Password is required");
      return;
    }
    if (!passwordRegex.test(password)) {
      toast.error(
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
      );
      return;
    }

    setLoading(true);

    // Check if email already exists
    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const existing = await getDocs(q);
      if (!existing.empty) {
        toast.error("This email is already registered");
        setLoading(false);
        return;
      }

      await createUserAccount({
        email,
        password,
        name,
        role,
        phone,
        department,
        position,
      });
      toast.success("User added successfully!");
      setForm({
        name: "",
        email: "",
        password: "",
        position: "",
        department: "",
        phone: "",
        role: "user",
      });
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={"ghost"}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex w-full border justify-start"
          >
            <Plus size={20} />
            Add User
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus size={20} />
              Add User
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="flex gap-4 flex-wrap flex-1">
              <div>
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm({ ...form, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    {userProfile.role === "admin" && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-1/3">
                <Label>Department</Label>
                <Input
                  type="text"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Position</Label>
                <Input
                  type="text"
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

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
            <Button disabled={loading} onClick={handleAddUser}>
              {loading ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
