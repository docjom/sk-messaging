import { useEffect, useState } from "react";
import { query, getDocs, orderBy } from "firebase/firestore";
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
import { getRefs } from "@/utils/firestoreRefs";
import { useMessageActionStore } from "@/stores/useMessageActionStore";

export const ChatFiles = ({ chatId }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [linkList, setLinkList] = useState([]);
  const { topicId } = useMessageActionStore();

  useEffect(() => {
    const fetchFiles = async () => {
      const { filesRef } = getRefs({ chatId, topicId });

      const q = query(filesRef, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const media = [];
      const docs = [];
      const links = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const file = data.fileData;

        // Media or Docs
        if (file) {
          const mimeType = file.type;
          if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
            media.push({
              url: file.url,
              type: mimeType.startsWith("image/") ? "image" : "video",
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

        if (data.type === "link" && data.url) {
          links.push({
            url: data.url,
            timestamp: data.timestamp?.toDate(),
          });
        }
      });

      setMediaFiles(media);
      setDocumentFiles(docs);
      setLinkList(links);
    };

    fetchFiles();
  }, [chatId, topicId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="flex w-full justify-start gap-2"
        >
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
            <TabsTrigger value="links">Links</TabsTrigger>
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
                    <p className="text-[10px] text-gray-500">
                      {file.timestamp?.toLocaleString()}
                    </p>
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
                    <div className="flex gap-2 justify-start items-center">
                      <Icon
                        icon="solar:file-text-bold"
                        width="20"
                        height="20"
                        className="text-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium truncate max-w-[240px]">
                          {file.name}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {file.timestamp?.toLocaleString()}
                        </div>
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
          <TabsContent value="links">
            <div className="space-y-2 max-h-80 overflow-y-auto p-1">
              {linkList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  No links found.
                </p>
              ) : (
                linkList.map((link, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border p-2 rounded"
                  >
                    <div className="text-sm truncate max-w-[240px] text-blue-600">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.url}
                      </a>
                      <div className="text-[10px] text-gray-400">
                        {link.timestamp?.toLocaleString()}
                      </div>
                    </div>

                    <Icon
                      icon="solar:link-round-bold"
                      className="text-blue-500"
                      width="20"
                      height="20"
                    />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
              }}
              type="button"
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
