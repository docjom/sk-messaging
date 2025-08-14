import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditGroup } from "./EditGroup";
import { LeaveGroup } from "./LeaveGroup";
import { PinnedMessages } from "../chat/PinnedMessages";
import { ChatFiles } from "../chat/ChatFiles";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { AddAdmin } from "../chat-folder/addAdmin";
import { Menu, Settings } from "lucide-react";
import { Button } from "../ui/button";

export default function ManageGroupChat({
  chatId,
  currentUserId,
  clearCurrentChat,
}) {
  const { topicId } = useMessageActionStore();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <span className="flex justify-center items-center w-10 h-10 border rounded-full border-gray-300 dark:border-gray-600">
            <Settings size={18} />
          </span>
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
