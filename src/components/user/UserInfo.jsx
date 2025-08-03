import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const UserInfo = ({ user, isOpen, onClose }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        {user && (
          <>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback>P</AvatarFallback>
              </Avatar>

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-0.5 gap-x-2">
                  {user.department && (
                    <span
                      title="Department"
                      className="text-xs font-semibold text-center text-blue-500 bg-gray-100 border px-2 py-0.5 rounded-full"
                    >
                      {user.department}
                    </span>
                  )}
                  {user.position && (
                    <span
                      title="Position"
                      className="text-xs text-center font-semibold text-gray-800 bg-gray-100 border px-2 py-0.5 rounded-full"
                    >
                      {user.position}
                    </span>
                  )}
                </div>
                <h1 title="Name" className=" font-bold  text-2xl">
                  {user.displayName}
                </h1>
                <div>
                  <span title="Email" className="text-xs  text-blue-500 ">
                    {user.email}
                  </span>{" "}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
