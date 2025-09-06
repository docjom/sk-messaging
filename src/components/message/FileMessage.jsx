import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!fileData) return null;

  const isImage = fileData.type.startsWith("image/");
  const isVideo = fileData.type.startsWith("video/");
  const isPdf = fileData.type.includes("pdf");
  const messageId = message.id;
  const isImageLoaded = loadingStates[messageId]?.imageLoaded || false;
  const isVideoLoaded = loadingStates[messageId]?.videoLoaded || false;

  const isImageError = loadingStates[messageId]?.imageError || false;
  const isVideoError = loadingStates[messageId]?.videoError || false;

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);

      link.href = objectUrl;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download the file. Please try again.");
    }
  };

  const openMediaDialog = () => {
    setIsDialogOpen(true);
  };

  // const closeMediaDialog = () => {
  //   setIsDialogOpen(false);
  // };

  return (
    <>
      <div className="w-full sm:max-w-[20rem] md:max-w-[28rem]  rounded-lg">
        {isImage && (
          <div className="relative">
            {/* Loading or error placeholder */}
            {!isImageLoaded && !isImageError && (
              <div
                className={`w-52 h-52  flex items-center justify-center ${
                  message.message !== "" ? "rounded-t-xl" : "rounded-xl"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon
                    icon="eos-icons:loading"
                    width="24"
                    height="24"
                    className="text-gray-400 animate-spin"
                  />
                  <span className="text-xs text-gray-400">Loading...</span>
                </div>
              </div>
            )}

            {isImageError && (
              <div
                className={`w-52 h-52 border border-gray-200 dark:border-gray-400 flex items-center justify-center ${
                  message.message !== "" ? "rounded-t-xl" : "rounded-xl"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon
                    icon="ic:round-broken-image"
                    width="24"
                    height="24"
                    className="text-gray-400"
                  />
                  <span className="text-xs text-gray-400">Image Deleted</span>
                </div>
              </div>
            )}

            <img
              src={fileData.url}
              alt={fileData.name}
              className={`max-w-52 h-auto object-cover border cursor-pointer hover:opacity-90 transition-opacity ${
                message.message !== "" ? "rounded-t-xl" : "rounded-lg"
              } ${!isImageLoaded || isImageError ? "hidden" : ""}`}
              onClick={openMediaDialog}
              onLoad={() => handleImageLoad(messageId)}
              onError={() => handleImageLoad(messageId, true)}
            />
          </div>
        )}

        {isVideo && (
          <div className="relative">
            {/* Loading placeholder */}
            {!isVideoLoaded && !isVideoError && (
              <div className="w-52 h-52 flex items-center justify-center border">
                <Icon
                  icon="eos-icons:loading"
                  className="animate-spin text-gray-400"
                />
                <span className="text-xs text-gray-400">Loading video...</span>
              </div>
            )}

            {isVideoError && (
              <div className="w-52 h-52 flex items-center justify-center border">
                <Icon icon="ic:round-videocam-off" className="text-gray-400" />
                <span className="text-xs text-gray-400">Video Deleted</span>
              </div>
            )}

            <div className="relative">
              <video
                src={fileData.url}
                className={`max-w-52 h-auto object-cover border cursor-pointer hover:opacity-90 transition-opacity ${
                  message.message !== "" ? "rounded-t-lg" : "rounded-xl"
                } ${!isVideoLoaded || isVideoError ? "hidden" : ""}`}
                onLoadedData={() => handleVideoLoad(messageId)}
                onError={() => handleVideoLoad(messageId, true)}
                onClick={openMediaDialog}
                muted
              />

              {/* Play button overlay */}
              {isVideoLoaded && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={openMediaDialog}
                >
                  <div className="bg-black bg-opacity-50 rounded-full p-2">
                    <Icon
                      icon="ic:round-play-arrow"
                      width="32"
                      height="32"
                      className="text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isImage && !isVideo && (
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
        )}

        {message.message && (
          <div
            dangerouslySetInnerHTML={{
              __html: formatMessageWithLinks(
                message.message,
                message.senderId,
                user?.uid
              ),
            }}
            className={`text-sm max-w-52 sm:max-w-80 px-2 py-2 whitespace-pre-wrap break-words ${
              message.senderId === user?.uid ? "text-white" : ""
            }`}
          />
        )}
      </div>

      {/* Media Dialog/Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 max-w-80 bg-opacity-50  p-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-medium max-w-80 truncate">
                {fileData.name}
              </DialogTitle>
              {/* <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadFile(fileData.url, fileData.name)}
                  className=" hover:bg-opacity-20"
                >
                  <Icon icon="solar:download-bold" width="16" height="16" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={closeMediaDialog}
                  className=" hover:bg-opacity-20"
                >
                  <Icon icon="ic:round-close" width="20" height="20" />
                </Button>
              </div> */}
            </div>
          </DialogHeader>

          <div className="flex items-center justify-center min-h-[60vh] ">
            {isImage && (
              <img
                src={fileData.url}
                alt={fileData.name}
                className="max-w-full max-h-[80vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {isVideo && (
              <video
                src={fileData.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>

          {/* Media info footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-opacity-50  p-1">
            <div className="flex items-center justify-between text-sm">
              <span>{formatFileSize(fileData.size)}</span>
              <span className="text-xs opacity-75">Click outside to close</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
