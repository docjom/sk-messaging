import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
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
import { toast } from "sonner";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export function Logout() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      auth.signOut().then(() => {
        navigate("/");
      });
    } catch (e) {
      console.error("Error logging out: ", e);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="border bg-red-500 w-full">
            <Icon icon="solar:logout-broken" width="24" height="24" /> Logout
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleLogout}>
          <DialogHeader>
            <DialogTitle>Log out</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging out..." : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
