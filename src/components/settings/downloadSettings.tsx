import React, { useState, useEffect } from "react";
import {
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  LinearProgress,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { 
  getDownloadedItems, 
  removeDownloadedItem, 
  clearDownloads,
  getDownloadSettings,
  saveDownloadSettings,
  getDownloadStorageUsage,
  type DownloadSettings,
} from "@/utils/storage/downloads";
import { useCentralStore } from "@/utils/store/central";
import { getImageUrlsApi } from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import { open } from "@tauri-apps/plugin-dialog";

const DownloadSettingsPanel = () => {
  const { enqueueSnackbar } = useSnackbar();
  const api = useApiInContext((s) => s.api);
  const [user] = useCentralStore((state) => [state.currentUser]);
  
  // Download settings state
  const [settings, setSettings] = useState<DownloadSettings>(getDownloadSettings());
  
  // Downloaded items state
  const [downloads, setDownloads] = useState(getDownloadedItems());
  const [storageUsed, setStorageUsed] = useState(getDownloadStorageUsage());
  
  // Update downloads list when component mounts
  useEffect(() => {
    refreshDownloads();
  }, []);
  
  // Refresh downloads list
  const refreshDownloads = () => {
    setDownloads(getDownloadedItems().filter(item => item.userId === user?.Id));
    setStorageUsed(getDownloadStorageUsage());
  };
  
  // Handle setting changes
  const handleSettingChange = (key: keyof DownloadSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveDownloadSettings(newSettings);
  };
  
  // Handle selecting download folder
  const handleSelectFolder = async () => {
    try {
      // In a real app with Tauri, you'd use:
      // const selectedPath = await open({ directory: true });
      // For now, we'll simulate this:
      const selectedPath = "/path/to/downloads"; // Placeholder
      
      if (selectedPath) {
        handleSettingChange('downloadPath', selectedPath);
        enqueueSnackbar("Download folder updated successfully", { variant: "success" });
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
      enqueueSnackbar("Error selecting download folder", { variant: "error" });
    }
  };
  
  // Handle removing a download
  const handleRemoveDownload = (id: string, name: string) => {
    removeDownloadedItem(id);
    refreshDownloads();
    enqueueSnackbar(`Removed "${name}" from downloads`, { variant: "info" });
  };
  
  // Handle clearing all downloads
  const handleClearDownloads = () => {
    clearDownloads();
    refreshDownloads();
    enqueueSnackbar("All downloads cleared", { variant: "info" });
  };

  return (
    <div className="settings-container">
      <Typography variant="h5" gutterBottom>
        Download Settings
      </Typography>
      
      {/* Download Path Setting */}
      <div className="settings-option">
        <Typography variant="subtitle1">Download Location</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <TextField
            fullWidth
            variant="filled"
            value={settings.downloadPath || "Default browser location"}
            disabled
          />
          <Button variant="contained" onClick={handleSelectFolder}>
            Browse
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Files will be saved to this location when downloading media
        </Typography>
      </div>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Show Offline Content Setting */}
      <div className="settings-option">
        <FormControlLabel
          control={
            <Switch
              checked={settings.showOfflineContent}
              onChange={(e) => handleSettingChange('showOfflineContent', e.target.checked)}
            />
          }
          label="Show offline content when disconnected"
        />
        <Typography variant="caption" color="text.secondary" display="block">
          When enabled, downloaded content will be available in offline mode
        </Typography>
      </div>
      
      {/* Auto Delete Setting */}
      <div className="settings-option">
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoDeleteWatched}
              onChange={(e) => handleSettingChange('autoDeleteWatched', e.target.checked)}
            />
          }
          label="Auto-delete watched content"
        />
        <Typography variant="caption" color="text.secondary" display="block">
          Automatically remove downloads after you've finished watching them
        </Typography>
      </div>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Downloaded Content Section */}
      <Typography variant="h6" gutterBottom>
        Downloaded Content
      </Typography>
      
      {/* Storage Usage */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            Storage Used
          </Typography>
          <Typography variant="h5">
            {storageUsed === 0 ? "Not available" : `${(storageUsed / 1024 / 1024).toFixed(2)} MB`}
          </Typography>
        </CardContent>
      </Card>
      
      {/* Downloads List */}
      {downloads.length > 0 ? (
        <>
          <List>
            {downloads.map((item) => (
              <ListItem key={item.id} divider>
                <ListItemAvatar>
                  <Avatar
                    alt={item.name}
                    src={
                      api && item.imageTag
                        ? getImageUrlsApi(api).getItemImageUrlById(
                            item.id,
                            "Primary",
                            { tag: item.imageTag }
                          )
                        : undefined
                    }
                  >
                    {!item.imageTag && (
                      <span className="material-symbols-rounded">movie</span>
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={item.name}
                  secondary={`Downloaded: ${new Date(item.downloadDate).toLocaleDateString()}`}
                />
                {item.progress > 0 && (
                  <Box sx={{ width: '40%', mr: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={item.progress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" align="center" display="block">
                      {item.progress}% watched
                    </Typography>
                  </Box>
                )}
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveDownload(item.id, item.name)}
                  >
                    <span className="material-symbols-rounded">delete</span>
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            variant="outlined"
            color="error"
            startIcon={<span className="material-symbols-rounded">delete_sweep</span>}
            onClick={handleClearDownloads}
            sx={{ mt: 2 }}
          >
            Clear All Downloads
          </Button>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No downloaded content
        </Typography>
      )}
    </div>
  );
};

export default DownloadSettingsPanel;