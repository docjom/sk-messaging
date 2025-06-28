import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Contacts } from "@/components/Contacts";
import { CreateGroupChat } from "@/components/CreateGroupChat";
import { EditProfile } from "@/components/EditProfile";
import { Logout } from "@/components/Logout";

export const Menu = ({
  users,
  isCreatingGroup,
  createGroupChat,
  user,
  displayUser,
  handleSelectUser,
  closeMenu,
}) => {
  return (
    <>
      <div>
        {" "}
        <div className="w-64 bg-gray-800 text-white fixed top-0 left-0 z-50 overflow-y-auto p-4 flex flex-col h-full">
          <div className=" rounded mb-4 flex items-center gap-2 justify-start">
            <Avatar className="w-12 h-12">
              <AvatarImage src={displayUser?.photoURL} />
              <AvatarFallback>P</AvatarFallback>
            </Avatar>
            <h1 className="text-lg font-semibold capitalize">
              {displayUser?.displayName}
            </h1>
          </div>
          <hr className="border border-gray-700 m-1" />
          <EditProfile currentUserId={displayUser.uid} />
          <CreateGroupChat
            users={users}
            currentUserId={user.uid}
            submitText="Create Group"
            isLoading={isCreatingGroup}
            onSubmit={createGroupChat}
          />
          <Contacts
            users={users}
            currentUserId={user?.uid}
            handleSelectUser={handleSelectUser}
          />
          {/* Logout Button */}
          <div className="absolute w-full bottom-0 left-0 p-2">
            <Logout />
          </div>
        </div>
        <div
          onClick={() => closeMenu()}
          className=" bg-gray-500/30 fixed top-0 left-0 z-40 w-screen h-screen backdrop-blur-sm"
        ></div>
      </div>
    </>
  );
};
