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
import { ContactRound } from "lucide-react";

export function Contacts({ users, currentUserId, handleSelectUser }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className=" w-full mb-1 flex justify-start gap-4 items-center"
        >
          <ContactRound />
          Contacts
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contacts</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {users
            .filter((u) => u.id !== currentUserId)
            .map((u) => (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className="flex items-center gap-2 mb-0 border max-w-96 overflow-hidden truncate my-1 hover:dark:bg-gray-700 hover:bg-gray-200 rounded-lg p-2"
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {u?.email}
                  </p>
                </div>
              </div>
            ))}
        </div>
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
