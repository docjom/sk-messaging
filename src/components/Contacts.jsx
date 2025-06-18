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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Firebase Storage imports

export function Contacts({ users, currentUserId, handleSelectUser }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className=" w-full mb-1 flex justify-start gap-4 items-center"
        >
          <Icon icon="iconoir:profile-circle" width="30" height="30" />
          Contacts
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contacts</DialogTitle>
        </DialogHeader>

        {users
          .filter((u) => u.id !== currentUserId)
          .map((u) => (
            <div
              key={u.id}
              onClick={() => handleSelectUser(u)}
              className="flex items-center gap-3 hover:bg-gray-200 rounded-lg p-2"
            >
              <Avatar className="w-8 h-8">
                {u?.photoURL ? (
                  <AvatarImage src={u?.photoURL} />
                ) : (
                  <AvatarFallback>{u?.displayName?.[0]}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-medium capitalize">{u?.displayName}</p>
                <p className="text-xs text-gray-500">{u?.email}</p>
              </div>
            </div>
          ))}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
