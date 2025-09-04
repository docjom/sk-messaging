import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, formatTimestamp } from "@/composables/scripts";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Download, File, FileText, Image, Video } from "lucide-react";

export function MessagesDialog({
  open,
  onOpenChange,
  user,
  messages,
  loading,
}) {
  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) {
      return <Image className="w-5 h-5" />;
    }
    if (fileType.startsWith("video/")) {
      return <Video className="w-5 h-5" />;
    }
    if (
      fileType.includes("pdf") ||
      fileType.includes("document") ||
      fileType.includes("text")
    ) {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };
  const FileAttachment = ({ fileData }) => {
    const isImage = fileData.type.startsWith("image/");
    const isVideo = fileData.type.startsWith("video/");

    return (
      <div className="mt-3 border rounded-lg overflow-hidden bg-muted/30">
        {isImage && (
          <div className="aspect-video max-w-sm bg-muted/50 flex items-center justify-center">
            <img
              src={fileData.url}
              alt={fileData.name}
              className="max-w-full max-h-full object-contain rounded-t-lg"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        {isVideo && (
          <div className="aspect-video max-w-sm bg-muted/50">
            <video
              src={fileData.url}
              className="w-full h-full object-contain rounded-t-lg"
              controls
              preload="metadata"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-muted-foreground">
              {getFileIcon(fileData.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate max-w-20  sm:max-w-52 font-medium">
                {fileData.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(fileData.size)} • {fileData.type}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(fileData.url, "_blank")}
            className="ml-3"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {user && (
              <>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback>
                    {user.displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  Messages with {user.displayName}
                </span>
                {!loading && (
                  <Badge variant="secondary">{messages.length} messages</Badge>
                )}
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm">
            View the most recent messages sent by this user across all chats and
            topics. Only top 50 most recent messages are shown.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          {loading ? (
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No messages found
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {messages.map((message, index) => (
                <div key={index} className="space-y-2">
                  {/* Message Header */}
                  <div className="flex flex-1 min-w-0 items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium truncate ">
                      {message.chatName}
                    </span>
                    <span>•</span>
                    {message.topicName && (
                      <>
                        <span className="truncate">{message.topicName}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{formatTimestamp(message.timestamp)}</span>
                    {message.pinned && (
                      <Badge variant="outline" className="ml-auto">
                        📌 Pinned
                      </Badge>
                    )}
                  </div>

                  {/* Reply Context */}
                  {message.replyTo && (
                    <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary/30">
                      <div className="text-sm text-muted-foreground">
                        Replying to{" "}
                        <span className="font-medium">
                          {message.replyTo.senderName}
                        </span>
                      </div>
                      <p className="text-sm mt-1 italic">
                        "{message.replyTo.message}"
                      </p>
                    </div>
                  )}

                  {/* Main Message */}
                  <div className="bg-card border rounded-lg p-4">
                    <p className="text-foreground">{message.message}</p>
                    {/* File Attachment */}
                    {message.fileData && (
                      <FileAttachment fileData={message.fileData} />
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            message.status === "sent" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {message.status}
                        </Badge>
                        {message.seen && (
                          <Badge variant="outline" className="text-xs">
                            ✓ Seen
                          </Badge>
                        )}
                      </div>
                      {/* <span className="text-xs text-muted-foreground">
                        Chat: {message.chatId}
                      </span> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
