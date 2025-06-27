import React from "react";
import { Icon } from "@iconify/react";

export const ReplyMessageDisplay = ({ message }) => {
  const { replyTo } = message;

  if (!replyTo) {
    return null;
  }

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith("image/")) {
      return (
        <Icon
          icon="solar:gallery-bold"
          className="text-blue-500"
          width="14"
          height="14"
        />
      );
    } else if (fileType?.startsWith("video/")) {
      return (
        <Icon
          icon="solar:videocamera-bold"
          className="text-red-500"
          width="14"
          height="14"
        />
      );
    } else if (fileType?.startsWith("audio/")) {
      return (
        <Icon
          icon="solar:music-note-bold"
          className="text-green-500"
          width="14"
          height="14"
        />
      );
    } else {
      return (
        <Icon
          icon="solar:document-bold"
          className="text-gray-500"
          width="14"
          height="14"
        />
      );
    }
  };

  const renderFilePreview = (fileData) => {
    if (!fileData) return null;

    if (fileData.type?.startsWith("image/")) {
      return (
        <div className="mt-1 relative">
          <img
            src={fileData.url}
            alt={fileData.name}
            className="max-w-[120px] max-h-[80px] object-cover rounded border"
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 mt-1 p-2 bg-white bg-opacity-50 rounded border">
        {getFileIcon(fileData.type)}
        <span className="text-xs text-gray-600 truncate max-w-[100px]">
          {fileData.name}
        </span>
      </div>
    );
  };

  return (
    <div className="mb-2 border-l-4 border-blue-400 bg-blue-50 bg-opacity-60 p-2 rounded-r-xl rounded-l-lg">
      {/* Reply header */}
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm font-semibold text-blue-600">
          {replyTo.senderName}
        </span>
      </div>

      {/* Original message content */}
      <div className="text-xs text-gray-600">
        {/* File preview if exists */}
        {replyTo.fileData && renderFilePreview(replyTo.fileData)}

        {/* Original message text */}
        {replyTo.message && (
          <div className=" line-clamp-2 break-words">{replyTo.message}</div>
        )}

        {/* Fallback for empty replies */}
        {!replyTo.message && !replyTo.fileData && (
          <div className="italic text-gray-400">Message not available</div>
        )}
      </div>
    </div>
  );
};
