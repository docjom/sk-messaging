import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { EditGroup } from "@/components/EditGroup";

export default function ManageGroupChat() {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-gray-500/20  rounded-full p-1">
          <Icon icon="solar:settings-broken" width="24" height="24" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Group Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <EditGroup />
          <DropdownMenuItem>Leave</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
