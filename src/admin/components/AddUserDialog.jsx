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
import {
  Briefcase,
  Building2,
  Lock,
  Mail,
  Phone,
  Pin,
  Plus,
  User,
  UserPlus,
} from "lucide-react";
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
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add New User
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <Plus size={16} className="text-primary" />
            </div>
            Add New User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <User size={16} className="text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">
                Personal Information
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User size={14} />
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone size={14} />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Lock size={16} className="text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">
                Account Information
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail size={14} />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock size={14} />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Work Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Building2 size={16} className="text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">
                Work Information
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Briefcase size={14} />
                  Role
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm({ ...form, role: value })}
                >
                  <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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

              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 size={14} />
                  Department
                </Label>
                <Input
                  id="department"
                  placeholder="Enter department"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <Label htmlFor="position" className="flex items-center gap-2">
                  <Briefcase size={14} />
                  Position
                </Label>
                <Input
                  id="position"
                  placeholder="Enter position"
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
              }}
              type="button"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={loading}
            onClick={handleAddUser}
            className="w-full sm:w-auto gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Adding User...
              </>
            ) : (
              <>
                <Plus size={16} />
                Add User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
