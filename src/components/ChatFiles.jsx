import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ChatFiles = ({ chatId }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(
        messagesRef,
        where("fileData", "!=", null),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(q);

      const media = [];
      const docs = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const file = data.fileData;

        if (file) {
          const mimeType = file.type;

          if (mimeType.startsWith("image/")) {
            media.push({
              url: file.url,
              type: "image",
              name: file.name || "Untitled",
              timestamp: data.timestamp?.toDate(),
            });
          } else if (mimeType.startsWith("video/")) {
            media.push({
              url: file.url,
              type: "video",
              name: file.name || "Untitled",
              timestamp: data.timestamp?.toDate(),
            });
          } else {
            docs.push({
              url: file.url,
              type: mimeType,
              name: file.name || "Unnamed File",
              timestamp: data.timestamp?.toDate(),
            });
          }
        }
      });

      setMediaFiles(media);
      setDocumentFiles(docs);
    };

    fetchFiles();
  }, [chatId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-start gap-2">
          <Icon icon="solar:folder-with-files-broken" width="20" height="20" />
          Media & Files
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Media & Files</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="imageAndVideos" className="w-full">
          <TabsList className="w-full justify-around">
            <TabsTrigger value="imageAndVideos">Images & Videos</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="imageAndVideos">
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
              {mediaFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-2 text-center">
                  No media files.
                </p>
              ) : (
                mediaFiles.map((file, index) => (
                  <div key={index} className="rounded overflow-hidden border">
                    {file.type === "image" ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-28 object-cover"
                      />
                    ) : (
                      <video
                        controls
                        className="w-full h-28 object-cover"
                        src={file.url}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="files">
            <div className="space-y-2 max-h-80 overflow-y-auto p-1">
              {documentFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  No files.
                </p>
              ) : (
                documentFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border p-2 rounded"
                  >
                    <div className="flex gap-2">
                      <Icon
                        icon="solar:file-text-bold"
                        width="20"
                        height="20"
                        className="text-blue-500"
                      />
                      <div className="text-sm font-medium truncate max-w-[240px]">
                        {file.name}
                      </div>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 text-sm"
                    >
                      <Icon
                        icon="solar:download-broken"
                        width="20"
                        height="20"
                      />
                    </a>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
