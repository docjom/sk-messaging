import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { EditGroup } from "./EditGroup";
import { LeaveGroup } from "./LeaveGroup";
import { PinnedMessages } from "../chat/PinnedMessages";
import { ChatFiles } from "../chat/ChatFiles";

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
          <PinnedMessages chatId={chatId} />
          <ChatFiles chatId={chatId} />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
