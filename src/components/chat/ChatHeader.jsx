import React from "react";
import { Icon } from "@iconify/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ManageGroupChat from "../group/GroupChatSetting";
import { AddUsersToGroup } from "@/components/group/AddUserToGroup";
import { PinnedMessages } from "@/components/chat/PinnedMessages";
import { ChatFiles } from "@/components/chat/ChatFiles";
import { TypingIndicator } from "./TypingIndicator";

const ChatHeader = ({
  currentChat,
  selectedUser,
  user,
  users,
  chatId,
  getChatDisplayName,
  getSenderDisplayName,
  clearChatId,
  setIfUserInfoOpen,
  addUsersToGroup,
  isAddingUsers,
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 border-b sm:ml-64 z-30">
      <div className="px-4 py-2 rounded shadow w-full flex items-center">
        <div className="w-full flex justify-start items-center gap-2">
          {/* Back button */}
          <div
            onClick={clearChatId}
            className="rounded-full sm:hidden bg-gray-200/50 dark:bg-gray-700 p-2 shadow"
          >
            <Icon icon="solar:rewind-back-broken" width="20" height="20" />
          </div>

          {/* Group Chat Header */}
          {currentChat?.type === "group" && (
            <GroupChatHeader
              currentChat={currentChat}
              user={user}
              users={users}
              chatId={chatId}
              getChatDisplayName={getChatDisplayName}
              getSenderDisplayName={getSenderDisplayName}
              clearChatId={clearChatId}
              addUsersToGroup={addUsersToGroup}
              isAddingUsers={isAddingUsers}
            />
          )}

          {/* Direct Chat Header */}
          {currentChat?.type === "direct" && selectedUser && (
            <DirectChatHeader
              selectedUser={selectedUser}
              chatId={chatId}
              getSenderDisplayName={getSenderDisplayName}
              setIfUserInfoOpen={setIfUserInfoOpen}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const GroupChatHeader = ({
  currentChat,
  user,
  users,
  chatId,
  getChatDisplayName,
  getSenderDisplayName,
  clearChatId,
  addUsersToGroup,
  isAddingUsers,
}) => (
  <div className="flex justify-between items-center w-full">
    <div className="flex justify-start gap-3 items-center w-full">
      <Avatar className="h-10 w-10">
        <AvatarImage src={currentChat.photoURL} />
        <AvatarFallback>
          {currentChat.name[0]?.toUpperCase() || "G"}
        </AvatarFallback>
      </Avatar>
      <div className="relative sm:max-w-52 max-w-20">
        <div className="font-semibold text-sm sm:max-w-52 max-w-20 truncate sm:text-lg capitalize">
          {getChatDisplayName(currentChat)}
          <div className="absolute -bottom-2.5  text-xs left-0">
            <TypingIndicator chatId={chatId} getName={getSenderDisplayName} />
          </div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <AddUsersToGroup
        users={users}
        currentUserId={user?.uid}
        currentChat={currentChat}
        submitText="Add Members"
        onSubmit={addUsersToGroup}
        isLoading={isAddingUsers}
      />
      <ManageGroupChat
        chatId={currentChat.id}
        currentUserId={user?.uid}
        clearCurrentChat={clearChatId}
      />
    </div>
  </div>
);

const DirectChatHeader = ({
  selectedUser,
  chatId,
  getSenderDisplayName,
  setIfUserInfoOpen,
}) => (
  <div className="flex justify-between items-center w-full">
    <Button
      type="button"
      variant="ghost"
      className="flex items-center p-0"
      onClick={() => setIfUserInfoOpen(true)}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage
          src={selectedUser.photoURL}
          alt={selectedUser.displayName}
        />
        <AvatarFallback>
          {selectedUser.displayName[0]?.toUpperCase() || "P"}
        </AvatarFallback>
      </Avatar>
      <div className="relative sm:max-w-96 max-w-40 truncate">
        <span className="text-lg truncate font-semibold capitalize">
          {selectedUser.displayName}
        </span>
        <div className="absolute -bottom-2 text-xs left-0">
          <TypingIndicator chatId={chatId} getName={getSenderDisplayName} />
        </div>
      </div>
    </Button>
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 transition">
            <Icon icon="solar:hamburger-menu-broken" width="20" height="20" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <div className="grid grid-cols-1">
            <Button
              onClick={() => setIfUserInfoOpen(true)}
              variant="ghost"
              className="flex justify-start"
            >
              <Icon icon="hugeicons:profile-02" width="20" height="20" />
              View Profile
            </Button>
            <PinnedMessages chatId={chatId} />
            <ChatFiles chatId={chatId} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>
);

export default ChatHeader;
