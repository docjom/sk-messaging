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
import { LeaveGroup } from "@/components/LeaveGroup";

export default function ManageGroupChat({
  chatId,
  currentUserId,
  clearCurrentChat,
}) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-gray-500/20  rounded-full p-1">
          <Icon icon="solar:settings-broken" width="24" height="24" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Group Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <EditGroup chatId={chatId} currentUserId={currentUserId} />
          <LeaveGroup
            chatId={chatId}
            currentUserId={currentUserId}
            onLeaveSuccess={clearCurrentChat}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
