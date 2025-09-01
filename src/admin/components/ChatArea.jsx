import { MoreVertical, Check, CheckCheck, Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { cn } from "../../components/ui/utils";

// ✅ Utility to format file sizes
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageBubble({ message }) {
  const renderContent = () => {
    // System messages (like "pinned a message")
    if (message.type === "system") {
      return (
        <div className="w-full flex justify-center">
          <span className="text-xs text-muted-foreground italic">
            {message.message}
          </span>
        </div>
      );
    }

    // File / Media messages
    if (message.type === "file" && message.fileData) {
      const { type, url, name, size } = message.fileData;

      if (type.startsWith("image/")) {
        return (
          <div className="rounded-lg overflow-hidden border max-w-xs sm:max-w-sm">
            <img src={url} alt={name} className="w-full h-auto object-cover" />
            {name && (
              <p className="text-xs mt-1 text-muted-foreground">{name}</p>
            )}
          </div>
        );
      }

      if (type.startsWith("video/")) {
        return (
          <div className="rounded-lg overflow-hidden border max-w-xs sm:max-w-sm">
            <video controls className="w-full rounded-lg">
              <source src={url} type={type} />
              Your browser does not support the video tag.
            </video>
            {name && (
              <p className="text-xs mt-1 text-muted-foreground">{name}</p>
            )}
          </div>
        );
      }

      // Generic file
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg hover:bg-accent/80"
        >
          <Download className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium">{name || "File"}</p>
            <p className="text-xs text-muted-foreground">
              {type} • {formatFileSize(size)}
            </p>
          </div>
        </a>
      );
    }

    // Normal text message
    return <p className="text-sm sm:text-base">{message.message}</p>;
  };

  return (
    <div
      className={cn(
        "flex gap-1.5 sm:gap-2 w-full mb-3 sm:mb-4",
        message.isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {!message.isOwn && message.type !== "system" && (
        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mt-1 flex-shrink-0">
          <AvatarImage src={message?.senderProfilePic} />
          <AvatarFallback className="bg-muted text-xs"></AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex flex-col min-w-0",
          message.isOwn ? "items-end" : "items-start"
        )}
      >
        { message.senderName && message.type !== "system" && (
          <span className="text-xs text-primary mb-0.5 sm:mb-1 px-1">
            {message.senderName}
          </span>
        )}

        <div
          className={cn(
            "px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl max-w-full break-words",
            message.isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : message.type === "system"
              ? "bg-transparent"
              : "bg-muted rounded-bl-md"
          )}
        >
          {renderContent()}
        </div>

        {message.type !== "system" && (
          <div
            className={cn(
              "flex items-center gap-1 mt-0.5 sm:mt-1 px-1",
              message.isOwn ? "flex-row-reverse" : ""
            )}
          >
            <span className="text-xs text-muted-foreground">
              {message.timestamp instanceof Date
                ? message.timestamp.toLocaleString()
                : ""}
            </span>
            {message.isOwn && message.status && (
              <div className="flex">
                {message.status === "sent" && (
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                )}
                {message.status === "delivered" && (
                  <CheckCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                )}
                {message.status === "read" && (
                  <CheckCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatArea({ chat, messages }) {
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="mb-2">Select a chat to start messaging</h2>
          <p className="text-muted-foreground">
            Choose a conversation from the sidebar to begin chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src={chat.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                {getInitials(chat.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm sm:text-base">{chat.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9">
            <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-background overflow-y-auto">
        {/* Chat Header */}

        {/* Messages */}
        <div className="flex-1 p-3 sm:p-4 bg-background ">
          <div className="space-y-0.5 sm:space-y-1">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
