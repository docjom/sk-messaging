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
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { AddAdmin } from "../chat-folder/addAdmin";

export default function ManageGroupChat({
  chatId,
  currentUserId,
  clearCurrentChat,
}) {
  const { topicId } = useMessageActionStore();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-gray-500/20  rounded-full p-1">
          <Icon icon="solar:settings-broken" width="24" height="24" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>
            {topicId ? <>Topic Settings</> : <>Group Settings</>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {topicId ? (
            <></>
          ) : (
            <>
              <EditGroup chatId={chatId} currentUserId={currentUserId} />
              <LeaveGroup
                chatId={chatId}
                currentUserId={currentUserId}
                onLeaveSuccess={clearCurrentChat}
              />
            </>
          )}
          <AddAdmin chatId={chatId} currentUserId={currentUserId} />
          <PinnedMessages chatId={chatId} />
          <ChatFiles chatId={chatId} />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
