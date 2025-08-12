import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
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
import FolderManagementSystem from "@/components/chat-folder/folder/createFolder";
import { ArrowRight, Bolt } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";

export const Settings = () => {
  const { userProfile } = useUserStore();
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className=" w-full mb-1 flex justify-start gap-4 items-center"
          >
            <Bolt />
            Settings
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>

          <div>
            {userProfile.role === "admin" && (
              <div className="mb-2">
                {" "}
                <Link to="/admin">
                  <Button>
                    {" "}
                    <ArrowRight />
                    Go to admin dashboard
                  </Button>
                </Link>
              </div>
            )}

            <FolderManagementSystem />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
