// Utility for managing downloaded media files

// Type definition for downloaded items
export interface DownloadedItem {
    id: string;
    name: string;
    downloadDate: string;
    userId: string;
    progress: number; // Playback progress percentage (0-100)
    type: string; // 'movie', 'episode', 'audio', etc.
    imageTag?: string; // For offline thumbnails
  }
  
  // LocalStorage keys
  const DOWNLOADS_KEY = 'blink_downloads';
  
  // Get all downloaded items
  export const getDownloadedItems = (): DownloadedItem[] => {
    try {
      const items = localStorage.getItem(DOWNLOADS_KEY);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Error reading downloads from localStorage:', error);
      return [];
    }
  };
  
  // Get downloaded items for a specific user
  export const getUserDownloadedItems = (userId: string): DownloadedItem[] => {
    const items = getDownloadedItems();
    return items.filter(item => item.userId === userId);
  };
  
  // Check if an item is downloaded
  export const isItemDownloaded = (itemId: string): boolean => {
    const items = getDownloadedItems();
    return items.some(item => item.id === itemId);
  };
  
  // Save a downloaded item
  export const saveDownloadedItem = (item: DownloadedItem): void => {
    try {
      const items = getDownloadedItems();
      
      // Check if item already exists and update it
      const existingIndex = items.findIndex(i => i.id === item.id);
      
      if (existingIndex >= 0) {
        items[existingIndex] = {...items[existingIndex], ...item};
      } else {
        items.push(item);
      }
      
      localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving download to localStorage:', error);
    }
  };
  
  // Update playback progress
  export const updateDownloadProgress = (itemId: string, progress: number): void => {
    try {
      const items = getDownloadedItems();
      const itemIndex = items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        items[itemIndex].progress = progress;
        localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(items));
      }
    } catch (error) {
      console.error('Error updating download progress:', error);
    }
  };
  
  // Remove a downloaded item
  export const removeDownloadedItem = (itemId: string): void => {
    try {
      const items = getDownloadedItems();
      const filteredItems = items.filter(item => item.id !== itemId);
      localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(filteredItems));
    } catch (error) {
      console.error('Error removing download from localStorage:', error);
    }
  };
  
  // Clear all downloads
  export const clearDownloads = (): void => {
    try {
      localStorage.removeItem(DOWNLOADS_KEY);
    } catch (error) {
      console.error('Error clearing downloads from localStorage:', error);
    }
};