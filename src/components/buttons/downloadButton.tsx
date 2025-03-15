import React, { useState, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import { blue, green } from "@mui/material/colors";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useApiInContext } from "@/utils/store/api";
import { useSnackbar } from "notistack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import type { LibraryApiGetDownloadRequest } from "@jellyfin/sdk/lib/generated-client";

// Import storage utility
// For this to work, place the downloads.ts file in your src/utils/storage directory
import { 
  isItemDownloaded, 
  saveDownloadedItem, 
  removeDownloadedItem 
} from "@/utils/storage/downloads";

export default function DownloadButton({
  itemId,
  itemName,
  queryKey,
  userId,
}: {
  itemId: string | undefined;
  itemName?: string | null;
  queryKey?: string[];
  userId: string | undefined;
}) {
  const api = useApiInContext((s) => s.api);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  // Check if item is already downloaded
  const [isDownloaded, setIsDownloaded] = useState(false);
  
  // Check download status on mount and when itemId changes
  useEffect(() => {
    if (itemId) {
      const downloaded = isItemDownloaded(itemId);
      setIsDownloaded(downloaded);
    }
  }, [itemId]);

  const handleDownload = async () => {
    if (!api) return;
    if (!itemId) return;
    if (!itemName) return;
    if (!userId) return;

    try {
      // If already downloaded, confirm deletion
      if (isDownloaded) {
        removeDownloadedItem(itemId);
        setIsDownloaded(false);
        enqueueSnackbar(`Removed "${itemName}" from downloads`, {
          variant: "info",
        });
        return { success: true, removed: true };
      }

      // Show progress dialog
      setDownloadOpen(true);
      setProgress(0);

      // Get the library API from SDK
      const libraryApi = getLibraryApi(api);
      
      // Prepare the download request parameters
      const downloadParams: LibraryApiGetDownloadRequest = {
        itemId: itemId
      };

      // Generate a file name from the item name (sanitize it)
      const sanitizedName = itemName.replace(/[/\\?%*:|"<>]/g, '-');
      const fileName = `${sanitizedName}.mp4`; // Default extension

      // Create a download URL
      const baseUrl = api.basePath;
      const downloadUrl = `${baseUrl}/Items/${itemId}/Download?api_key=${api.accessToken}`;
      
      // Use fetch with a progress tracker
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentLength = response.headers.get('Content-Length') || '0';
      const totalBytes = parseInt(contentLength, 10);
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('Unable to get response reader');
      }
      
      let receivedBytes = 0;
      const chunks = [];
      
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        chunks.push(value);
        receivedBytes += value.length;
        
        // Update progress
        const progressPercentage = Math.round((receivedBytes / totalBytes) * 100);
        setProgress(progressPercentage);
      }
      
      // Combine chunks into a single Uint8Array
      const allChunks = new Uint8Array(receivedBytes);
      let position = 0;
      
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }
      
      // Create blob from the downloaded data
      const blob = new Blob([allChunks], { 
        type: response.headers.get('Content-Type') || 'application/octet-stream'
      });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Set up download link
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Save download information including metadata for offline viewing
      saveDownloadedItem({
        id: itemId,
        name: itemName,
        downloadDate: new Date().toISOString(),
        userId: userId,
        progress: 0, // Initial watch progress
        type: 'movie', // You may want to pass the actual type from the item
      });
      
      // Close progress dialog and update state
      setDownloadOpen(false);
      setIsDownloaded(true);
      
      enqueueSnackbar(`Successfully downloaded "${itemName}"`, {
        variant: "success",
      });

      return { success: true };
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadOpen(false);
      throw error;
    }
  };

  const mutation = useMutation({
    mutationFn: handleDownload,
    onError: (error) => {
      enqueueSnackbar(`Error downloading "${itemName}"`, {
        variant: "error",
      });
      console.error(error);
      setDownloadOpen(false);
    },
    onSettled: async (data) => {
      // Don't invalidate queries if we're just removing a download
      if (queryKey && data && !data.removed) {
        return await queryClient.invalidateQueries({
          queryKey,
        });
      }
    },
    mutationKey: ["downloadButton", itemId],
  });

  return (
    <>
      <IconButton
        onClick={(e) => {
          if (!mutation.isPending) {
            mutation.mutate();
            e.stopPropagation();
          }
        }}
        style={{
          opacity: mutation.isPending ? 0.5 : 1,
          transition: "opacity 250ms",
        }}
        title={isDownloaded ? "Remove download" : "Download media"}
      >
        <div
          className="material-symbols-rounded"
          style={{
            //@ts-ignore
            "--fill": isDownloaded ? 1 : 0,
            color: isDownloaded ? green[500] : (mutation.isPending ? blue[500] : "white"),
          }}
        >
          {isDownloaded ? "download_done" : "download"}
        </div>
      </IconButton>

      {/* Download Progress Dialog */}
      <Dialog open={downloadOpen} maxWidth="sm" fullWidth>
        <DialogTitle>Downloading {itemName}</DialogTitle>
        <DialogContent>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ my: 2 }}
          />
          <Typography variant="body2" color="text.secondary" align="center">
            {progress}%
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}