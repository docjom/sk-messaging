import React, { useState, useRef, useEffect } from "react";
import { Send, Upload, File, Image, Video, FileText } from "lucide-react";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const FileUploadDialog = ({
  isOpen,
  onClose,
  onSend,
  chatId,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [wasLoading, setWasLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (wasLoading && !isLoading && selectedFile) {
      clearForm();
    }
    setWasLoading(isLoading);
  }, [isLoading, wasLoading, selectedFile]);

  const generateVideoThumbnail = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        video.currentTime = 0;
      });

      video.addEventListener("seeked", () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
        resolve(thumbnail);
      });

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      try {
        const thumbnail = await generateVideoThumbnail(file);
        setFilePreview(thumbnail);
      } catch (error) {
        console.error("Error generating thumbnail:", error);
        setFilePreview(null);
      }
    } else {
      setFilePreview(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleSend = () => {
    try {
      if (!selectedFile) {
        toast.error("Please select a file to send");
        return;
      }

      onSend({
        file: selectedFile,
        message: message.trim(),
        chatId,
      });
    } catch (error) {
      console.error("Error sending file:", error);
      toast.error("Failed to send file. Please try again.");
    }
  };

  const clearForm = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setMessage("");
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return <Image className="w-8 h-8" />;
    if (fileType.startsWith("video/")) return <Video className="w-8 h-8" />;
    if (fileType.includes("pdf")) return <FileText className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Send File</DialogTitle>
          {selectedFile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              className="text-red-500 hover:text-red-700"
            >
              <Icon icon="mingcute:delete-3-fill" width="24" height="24" />
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Choose a file or drag & drop
              </p>
              <p className="text-sm text-gray-500">
                Images, videos, documents (Max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
            </div>
          ) : (
            /* File Preview */
            <div className="space-y-4">
              {/* Preview Area */}
              <div className="border rounded-lg max-w- overflow-hidden bg-gray-50">
                {selectedFile.type.startsWith("image/") && filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className=" w-full max-h-64 object-contain"
                  />
                ) : selectedFile.type.startsWith("video/") && filePreview ? (
                  <img
                    src={filePreview}
                    alt="Video thumbnail"
                    className="w-full max-h-64 object-contain"
                  />
                ) : (
                  <div className="p-8 text-center">
                    <div className="flex items-center justify-center mb-4 text-gray-400">
                      {getFileIcon(selectedFile.type)}
                    </div>
                    <p className="font-medium text-gray-700 mb-1">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getFileIcon(selectedFile.type)}
                  <div>
                    <p className="font-medium text-sm truncate max-w-32">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          {selectedFile && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Add a message (optional)
              </label>
              <div className="border rounded-lg max-w-md">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a message..."
                  className=" outline-none w-80 resize-none max-h-80 border-none shadow-none sm:w-md whitespace-normal"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {selectedFile && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isLoading ? "Sending..." : "Send"}</span>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
