import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { EmojiReactions } from "@/components/EmojiReactions";

export const FileMessage = ({
  message,
  handleImageLoad,
  handleVideoLoad,
  loadingStates,
  user,
  formatTimestamp,
  formatFileSize,
  formatMessageWithLinks,
  getSenderData,
}) => {
  const { fileData } = message;
  if (!fileData) return null;

  const isImage = fileData.type.startsWith("image/");
  const isVideo = fileData.type.startsWith("video/");
  const isPdf = fileData.type.includes("pdf");
  const messageId = message.id;
  const isImageLoaded = loadingStates[messageId]?.imageLoaded || false;
  const isVideoLoaded = loadingStates[messageId]?.videoLoaded || false;

  const downloadFile = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-sm">
      {isImage && (
        <div className={`relative${message.message ? " mb-2" : ""}`}>
          {/* Loading placeholder */}
          {!isImageLoaded && (
            <div
              className={`w-52 h-52  border border-gray-200 flex items-center justify-center ${
                message.message !== "" ? "rounded-t-lg" : "rounded-lg"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon
                  icon="ic:round-image"
                  width="24"
                  height="24"
                  className="text-gray-400 animate-pulse"
                />
                <span className="text-xs text-gray-400">Loading...</span>
              </div>
            </div>
          )}

          <img
            src={fileData.url}
            alt={fileData.name}
            className={`max-w-52 h-auto object-cover cursor-pointer ${
              message.message !== "" ? "rounded-t-lg" : "rounded-lg"
            } ${!isImageLoaded ? "hidden" : ""}`}
            onClick={() => window.open(fileData.url, "_blank")}
            onLoad={() => handleImageLoad(messageId)}
          />

          {!message.message && isImageLoaded && (
            <div
              className={`absolute border-gray-200/50 border backdrop-blur-sm rounded-full max-w-52 gap-1 px-2 ${
                message.senderId === user.uid && !message.reactions
                  ? "justify-end bottom-1 right-1 bg-gray-200"
                  : "justify-start top-1 left-1 bg-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`text-xs py-0.5 ${
                    message.senderId === user.uid
                      ? "text-gray-800"
                      : "text-gray-800"
                  }`}
                >
                  {" "}
                  {message.bumpedFrom && <span className="px-1">Bump</span>}
                  {formatTimestamp(message.timestamp)}
                </div>

                {message.senderId === user.uid && (
                  <div className="flex text-gray-800">
                    {message.senderId === user.uid && (
                      <div className="flex">
                        {message.status === "sending" ? (
                          <Icon
                            icon="ic:round-access-time"
                            width="14"
                            height="14"
                            className="animate-pulse"
                          />
                        ) : message.status === "sent" && !message.seen ? (
                          <Icon icon="ic:round-check" width="16" height="16" />
                        ) : message.seen ? (
                          <Icon
                            icon="solar:check-read-linear"
                            width="20"
                            height="20"
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* emoji reactions to message */}
          {!message.message && (
            <>
              {/* emoji reactions to message */}
              {message.reactions && (
                <div className="p-1">
                  <EmojiReactions
                    msg={message}
                    getSenderData={getSenderData}
                    user={user}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isVideo && (
        <div className="mb-2 relative">
          {/* Loading placeholder */}
          {!isVideoLoaded && (
            <div
              className={`w-52 h-52  border border-gray-200 flex items-center justify-center ${
                message.message !== "" ? "rounded-t-lg" : "rounded-lg"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon
                  icon="ic:round-play-circle-filled"
                  width="32"
                  height="32"
                  className="text-gray-400 animate-pulse"
                />
                <span className="text-xs text-gray-400">Loading video...</span>
              </div>
            </div>
          )}

          <video
            src={fileData.url}
            controls
            className={`max-w-52 h-auto object-cover cursor-pointer ${
              message.message !== "" ? "rounded-t-lg" : "rounded-lg"
            } ${!isVideoLoaded ? "hidden" : ""}`}
            onLoadedData={() => handleVideoLoad(messageId)}
          />

          {!message.message && isVideoLoaded && (
            <div
              className={`absolute border-gray-200/50 border backdrop-blur-sm rounded-full max-w-52 gap-1 px-2 ${
                message.senderId === user.uid && !message.reactions
                  ? "justify-end bottom-1 right-1 bg-gray-200"
                  : "justify-start top-1 left-1 bg-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2 text-gray-800">
                <div className="text-xs py-0.5 flex">
                  {message.bumpedFrom && <span className="px-1">Bump</span>}
                  <p>{formatTimestamp(message.timestamp)}</p>
                </div>

                {message.senderId === user.uid && (
                  <div className="flex">
                    {message.senderId === user.uid && (
                      <div className="flex">
                        {message.status === "sending" ? (
                          <Icon
                            icon="ic:round-access-time"
                            width="14"
                            height="14"
                            className="animate-pulse"
                          />
                        ) : message.status === "sent" && !message.seen ? (
                          <Icon icon="ic:round-check" width="16" height="16" />
                        ) : message.seen ? (
                          <Icon
                            icon="solar:check-read-linear"
                            width="20"
                            height="20"
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* emoji reactions to message */}
          {message.reactions && (
            <div className="p-1">
              <EmojiReactions
                msg={message}
                getSenderData={getSenderData}
                user={user}
              />
            </div>
          )}
        </div>
      )}

      {!isImage && !isVideo && (
        <>
          <div
            className={`border max-w-52 relative px-3 py-2 bg-gray-50 ${
              message.message !== "" ? "rounded-t-lg pb-3" : "rounded-lg"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-blue-500">
                {isPdf ? (
                  <Icon icon="solar:file-text-bold" width="24" height="24" />
                ) : (
                  <Icon icon="solar:file-bold" width="24" height="24" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileData.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileData.size)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => downloadFile(fileData.url, fileData.name)}
                className="text-blue-500 hover:text-blue-700"
              >
                <Icon icon="solar:download-bold" width="16" height="16" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1">
            {/* emoji reactions to message */}
            {!message.message && (
              <>
                {/* emoji reactions to message */}
                {message.reactions && (
                  <EmojiReactions
                    msg={message}
                    getSenderData={getSenderData}
                    user={user}
                  />
                )}
              </>
            )}
            {!message.message && (
              <div
                className={` border-gray-200/50 border backdrop-blur-sm rounded-full max-w-32 gap-1 px-2 ${
                  message.senderId === user.uid
                    ? "justify-end bg-gray-500/50"
                    : "justify-start bg-gray-500/20"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <p
                    className={`text-xs py-0.5 ${
                      message.senderId === user.uid ? "text-white " : ""
                    }`}
                  >
                    {" "}
                    {message.bumpedFrom && <span className="px-1">Bump</span>}
                    {formatTimestamp(message.timestamp)}
                  </p>
                  {message.senderId === user.uid && (
                    <div className="flex">
                      {message.senderId === user.uid && (
                        <div className="flex">
                          {message.status === "sending" ? (
                            <Icon
                              icon="ic:round-access-time"
                              width="14"
                              height="14"
                              className="animate-pulse"
                            />
                          ) : message.status === "sent" && !message.seen ? (
                            <Icon
                              icon="ic:round-check"
                              width="16"
                              height="16"
                            />
                          ) : message.seen ? (
                            <Icon
                              icon="solar:check-read-linear"
                              width="20"
                              height="20"
                            />
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {message.message && (
        <>
          <div
            dangerouslySetInnerHTML={{
              __html: formatMessageWithLinks(
                message.message,
                message.senderId,
                user.uid
              ),
            }}
            className={`text-sm max-w-52 sm:max-w-80 px-2 whitespace-pre-wrap break-words  ${
              message.senderId === user.uid ? "text-white" : ""
            }`}
          />

          <div
            className={`flex items-center gap-1 px-2 ${
              message.senderId === user.uid ? "justify-end" : "justify-start"
            }`}
          >
            {/* emoji reactions to message */}
            {message.reactions && (
              <div className="p-1">
                <EmojiReactions
                  msg={message}
                  getSenderData={getSenderData}
                  user={user}
                />
              </div>
            )}
            <p
              className={`text-[10px] ${
                message.senderId === user.uid
                  ? "text-white/70"
                  : "text-gray-400"
              }`}
            >
              {" "}
              {message.bumpedFrom && <span className="px-1">Bump</span>}
              {formatTimestamp(message.timestamp)}
            </p>

            {message.senderId === user.uid && (
              <div className="flex">
                {message.senderId === user.uid && (
                  <div className="flex">
                    {message.status === "sending" ? (
                      <Icon
                        icon="ic:round-access-time"
                        width="14"
                        height="14"
                        className="animate-pulse"
                      />
                    ) : message.status === "sent" && !message.seen ? (
                      <Icon icon="ic:round-check" width="16" height="16" />
                    ) : message.seen ? (
                      <Icon
                        icon="solar:check-read-linear"
                        width="20"
                        height="20"
                      />
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
