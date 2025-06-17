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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export function EditGroup() {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="ghost">Manage Group</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Make changes. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center gap-4">
            <Avatar className="size-20">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <Button variant="ghost" className="border">
                Change
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Group Name</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
