import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { formatMessageWithLinks, formatFileSize } from "@/composables/scripts";
import { useUserStore } from "@/stores/useUserStore";

export const FileMessage = ({
  message,
  handleImageLoad,
  handleVideoLoad,
  loadingStates,
}) => {
  const user = useUserStore((s) => s.user);
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
    <div className="max-w-sm border rounded-lg">
      {isImage && (
        <div className="relative ">
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
            className={`max-w-52 h-auto object-cover border cursor-pointer ${
              message.message !== "" ? "rounded-t-lg" : "rounded-lg"
            } ${!isImageLoaded ? "hidden" : ""}`}
            onClick={() => window.open(fileData.url, "_blank")}
            onLoad={() => handleImageLoad(messageId)}
          />
        </div>
      )}

      {isVideo && (
        <div className=" relative">
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
            className={`max-w-52 h-auto object-cover border cursor-pointer ${
              message.message !== "" ? "rounded-t-lg" : "rounded-lg"
            } ${!isVideoLoaded ? "hidden" : ""}`}
            onLoadedData={() => handleVideoLoad(messageId)}
          />
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
        </>
      )}

      {message.message && (
        <>
          <div
            dangerouslySetInnerHTML={{
              __html: formatMessageWithLinks(
                message.message,
                message.senderId,
                user?.uid
              ),
            }}
            className={`text-sm max-w-52 sm:max-w-80 px-2 py-2 whitespace-pre-wrap break-words  ${
              message.senderId === user?.uid ? "text-white" : ""
            }`}
          />
        </>
      )}
    </div>
  );
};
