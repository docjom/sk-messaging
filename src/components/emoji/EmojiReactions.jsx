import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const EmojiReactions = ({ msg, getSenderData }) => {
  return (
    <div className="relative max-w-40 my-0.5">
      <div className="flex gap-1 justify-start items-center max-w-40 overflow-x-auto  scrollbar-hide">
        {msg.reactions && (
          <>
            {msg.reactions &&
              Object.entries(msg.reactions).map(([emojiSrcSet, users]) => (
                <span
                  key={emojiSrcSet}
                  className="flex gap-1 justify-start items-center border rounded-full  px-1 py-0.5 "
                >
                  <span className="rounded-full  size-5">
                    <picture className="cursor-pointer">
                      <source
                        srcSet={`https://em-content.zobj.net/source/telegram/386/${emojiSrcSet}.webp`}
                        type="image/webp"
                      />
                      <img
                        src={`https://em-content.zobj.net/source/telegram/386/${emojiSrcSet}.webp`}
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
                        <AvatarFallback></AvatarFallback>
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
      </div>
    </div>
  );
};
