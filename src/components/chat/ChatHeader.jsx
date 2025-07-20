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
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { useChatFolderStore } from "@/stores/chat-folder/useChatFolderStore";

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
  const { setFolderSidebar } = useChatFolderStore();
  const { topicId, currentTopic, clearTopicId } = useMessageActionStore();

  const openFolderSidebar = () => {
    setFolderSidebar(true);
    clearTopicId();
  };
  return (
    <div className="fixed top-0 left-0 right-0 border-b sm:ml-64 z-30">
      <div className="px-4 py-2 rounded shadow w-full flex items-center">
        <div className="w-full flex justify-start items-center gap-2">
          {/* Back button */}
          {topicId ? (
            <>
              <div
                onClick={() => openFolderSidebar()}
                className="rounded-full text-gray-700 dark:text-gray-300 sm:hidden bg-gray-200/50 dark:bg-gray-700 p-2 shadow"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 512 512"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="48"
                    d="M244 400L100 256l144-144M120 256h292"
                  />
                </svg>
              </div>
            </>
          ) : (
            <>
              <div
                onClick={clearChatId}
                className="rounded-full sm:hidden bg-gray-200/50 dark:bg-gray-700 p-2 shadow"
              >
                <Icon icon="solar:rewind-back-broken" width="20" height="20" />
              </div>
            </>
          )}

          {/* Group Chat Header */}
          {currentChat?.type === "group" && (
            <GroupChatHeader
              currentChat={currentChat}
              user={user}
              users={users}
              chatId={chatId}
              topicId={topicId}
              currentTopic={currentTopic}
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
  topicId,
  currentTopic,
}) => (
  <div className="flex justify-between items-center w-full">
    <div className="flex justify-start gap-3 items-center w-full">
      {topicId ? (
        <>
          {currentTopic.name === "General" ? (
            <div className="p-2.5 border rounded-full">
              {" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={16}
                height={16}
                viewBox="0 0 24 24"
              >
                <g fill="none">
                  <path
                    fill="currentColor"
                    d="m17.543 21.694l-.645-.382zm.271-.458l.646.382zm-1.628 0l-.646.382zm.27.458l.646-.382zm-4.266-2.737l.693-.287zm2.705 1.539l-.013.75zm-1.352-.186l-.287.693zm8.267-1.353l.693.287zm-2.705 1.539l-.013-.75zm1.352-.186l.287.693zm.35-7.942l-.393.64zm.825.826l.64-.392zm-8.438-.826l-.392-.64zm-.826.826l-.64-.392zm3.333 7.411l.377-.648zm7.031-2.567a.75.75 0 1 0-1.498-.076zm-1.56-3.914a.75.75 0 1 0 1.479-.248zm-2.983 7.952l.27-.458l-1.29-.764l-.271.458zm-2.649-.458l.271.458l1.291-.764l-.271-.458zm1.358-.306A.13.13 0 0 1 17 21.25c.027 0 .075.016.102.062l-1.29.764c.531.899 1.845.899 2.377 0zm-.648-8.562h1.5v-1.5h-1.5zm-3.5 4v-.5h-1.5v.5zm-1.5 0c0 .572 0 1.039.025 1.419c.027.387.083.738.222 1.075l1.386-.574c-.05-.123-.09-.293-.111-.603a22 22 0 0 1-.022-1.317zm3.658 2.996c-.628-.01-.892-.052-1.078-.13l-.574 1.387c.475.196.998.232 1.626.243zm-3.41-.502a3.25 3.25 0 0 0 1.758 1.759l.574-1.386a1.75 1.75 0 0 1-.947-.947zm7.62 2.002c.628-.011 1.15-.047 1.626-.243l-.574-1.386c-.186.077-.45.118-1.078.129zm1.999-2.576a1.75 1.75 0 0 1-.947.947l.574 1.386a3.25 3.25 0 0 0 1.759-1.76zm-3.367-5.92c.833 0 1.405 0 1.846.043c.429.04.655.115.818.215l.784-1.28c-.438-.268-.921-.377-1.46-.429c-.529-.05-1.184-.049-1.988-.049zm2.664.258c.236.144.434.342.578.578l1.28-.784a3.25 3.25 0 0 0-1.074-1.073zM16.25 11.25c-.804 0-1.46 0-1.987.05c-.54.05-1.023.16-1.461.429l.784 1.279c.163-.1.39-.174.819-.215c.44-.042 1.012-.043 1.845-.043zm-3.5 5c0-.833 0-1.405.043-1.845c.04-.43.115-.656.215-.82l-1.28-.783c-.268.438-.377.921-.429 1.46c-.05.529-.049 1.184-.049 1.988zm.052-4.521a3.25 3.25 0 0 0-1.073 1.073l1.279.784c.144-.236.342-.434.578-.578zm4.029 9.125c-.098-.165-.197-.335-.297-.472a1.5 1.5 0 0 0-.456-.425l-.754 1.296c-.037-.021-.04-.04-.002.013c.048.065.106.162.218.352zm-1.95.392c.227.004.346.006.43.016c.071.008.053.014.013-.009l.754-1.296a1.5 1.5 0 0 0-.601-.186c-.17-.019-.37-.022-.57-.025zm3.579.372c.112-.19.17-.287.218-.352c.039-.053.035-.034-.002-.013l-.754-1.296c-.206.12-.347.276-.456.425c-.1.137-.2.306-.297.472zm.632-1.872c-.198.003-.399.006-.569.025c-.184.02-.393.064-.601.186l.754 1.296c-.04.023-.058.017.012.009c.085-.01.204-.012.43-.016zm2.142-1.784c-.02.378-.06.57-.117.708l1.386.574c.154-.372.207-.765.23-1.206zm1.417-4.086a2.9 2.9 0 0 0-.38-1.074l-1.279.784c.076.123.137.283.18.538z"
                  ></path>
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 3L5 21M19 3l-1.806 6.5M22 9H4m-2 7h7"
                  ></path>
                </g>
              </svg>
            </div>
          ) : (
            <div className="p-2 border rounded-full">
              {" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 16 16"
              >
                <g fill="none">
                  <path
                    fill="url(#fluentColorChat160)"
                    d="M8 2a6 6 0 0 0-5.27 8.872l-.71 2.49a.5.5 0 0 0 .638.612l2.338-.779A6 6 0 1 0 8 2"
                  ></path>
                  <path
                    fill="url(#fluentColorChat161)"
                    d="M6 7a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 7m.5 1.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1"
                  ></path>
                  <defs>
                    <linearGradient
                      id="fluentColorChat160"
                      x1={2.429}
                      x2={12.905}
                      y1={4.25}
                      y2={22.111}
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#0fafff"></stop>
                      <stop offset={1} stopColor="#cc23d1"></stop>
                    </linearGradient>
                    <linearGradient
                      id="fluentColorChat161"
                      x1={6.35}
                      x2={6.728}
                      y1={6.553}
                      y2={9.801}
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#fdfdfd"></stop>
                      <stop offset={1} stopColor="#cceaff"></stop>
                    </linearGradient>
                  </defs>
                </g>
              </svg>
            </div>
          )}
        </>
      ) : (
        <>
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={currentChat.photoURL} />
            <AvatarFallback>
              {topicId ? (
                <>{currentTopic.name[0].toUpperCase()}</>
              ) : (
                <> {currentChat.name[0]?.toUpperCase() || "G"}</>
              )}
            </AvatarFallback>
          </Avatar>
        </>
      )}

      <div className="font-semibold text-sm sm:max-w-52 max-w-20 truncate sm:text-base capitalize">
        {topicId ? (
          <>{currentTopic.name}</>
        ) : (
          <> {getChatDisplayName(currentChat)}</>
        )}
        <div className=" text-xs">
          <TypingIndicator chatId={chatId} getName={getSenderDisplayName} />
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {topicId ? (
        <></>
      ) : (
        <AddUsersToGroup
          users={users}
          currentUserId={user?.uid}
          currentChat={currentChat}
          submitText="Add Members"
          onSubmit={addUsersToGroup}
          isLoading={isAddingUsers}
        />
      )}

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
      className="flex items-center justify-start relative p-0"
      onClick={() => setIfUserInfoOpen(true)}
    >
      <div className="flex gap-2 justify-start items-center">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={selectedUser.photoURL}
            alt={selectedUser.displayName}
          />
          <AvatarFallback></AvatarFallback>
        </Avatar>
        <div className="">
          <div className="text-base flex justify-start items-center font-semibold  capitalize">
            {selectedUser.displayName}
          </div>
          <div className="text-xs ">
            <TypingIndicator chatId={chatId} getName={getSenderDisplayName} />
          </div>
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
