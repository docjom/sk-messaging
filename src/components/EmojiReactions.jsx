import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const EmojiReactions = ({ msg, getSenderData, user }) => {
  return (
    <div className="relative max-w-40">
      <div className="flex gap-1 pr-2 justify-start items-center max-w-40 overflow-x-auto  scrollbar-hide">
        {msg.reactions && (
          <>
            {msg.reactions &&
              Object.entries(msg.reactions).map(([emojiSrcSet, users]) => (
                <span
                  key={emojiSrcSet}
                  className={`flex gap-1 justify-start items-center border rounded-full  px-1 py-0.5 ${
                    msg.senderId === user.uid
                      ? "border-gray-300"
                      : "bg-gray-200/50"
                  }`}
                >
                  <span className="rounded-full bg-gray-200/50 size-5">
                    <picture className="cursor-pointer">
                      <source
                        srcSet={`https://fonts.gstatic.com/s/e/notoemoji/latest/${emojiSrcSet}/512.webp`}
                        type="image/webp"
                      />
                      <img
                        src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${emojiSrcSet}/512.gif`}
                        alt=""
                        width="32"
                        height="32"
                      />
                    </picture>
                  </span>

                  <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-1 ">
                    {/* Map over users array for this emoji */}
                    {users.slice(0, 3).map((user) => (
                      <Avatar key={user.userId} className="h-5 w-5">
                        <AvatarImage
                          src={getSenderData(user.userId)?.photoURL}
                          alt={`@${user.userId}`}
                        />
                        <AvatarFallback>
                          {user.userId.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}

                    {/* Show +X if more than 3 users */}
                    {users.length > 3 && (
                      <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                        +{users.length - 3}
                      </div>
                    )}
                  </div>
                </span>
              ))}
          </>
        )}
        <div
          className={`pointer-events-none absolute inset-y-0 -right-1 w-1/3 bg-gradient-to-l  ${
            msg.senderId === user.uid
              ? " from-blue-500 "
              : " from-white dark:from-gray-800"
          }`}
        ></div>
      </div>
    </div>
  );
};
