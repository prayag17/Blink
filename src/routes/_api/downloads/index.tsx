// Fix the import path to your card component
import { Card } from "@/components/card/card";
import { type DownloadedItem, getUserDownloadedItems, removeDownloadedItem } from "@/utils/storage/downloads";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { Box, CircularProgress, Container, Grid, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import "./downloads.scss";

// Define proper route path that matches your router configuration
export const Route = createFileRoute('/_api/downloads')({
  component: DownloadedMoviesPage,
  loader: ({ context }) => {
    const { user } = context;
    
    // If user is logged in, get their downloads
    if (user?.Id) {
      const downloads = getUserDownloadedItems(user.Id);
      return {
        downloadedItems: downloads,
        count: downloads.length
      };
    }
    
    // Return empty data if no user
    return {
      downloadedItems: [],
      count: 0
    };
  }
});

// The component to render
function DownloadedMoviesPage() {
  const api = useApiInContext((s) => s.api);
  const user = useCentralStore((s) => s.currentUser);
  const loaderData = Route.useLoaderData();
  const [downloadedMovies, setDownloadedMovies] = useState<(BaseItemDto & {
    progress?: number;
    downloadDate?: string;
  })[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDownloadedMovies = async () => {
      try {
        setIsLoading(true);
        
        // Get locally stored downloaded movies from the loader data
        // Fix the property name to match what's returned in the loader
        const localDownloads: DownloadedItem[] = loaderData.downloadedItems || [];
        
        // Filter to only show movies (if your app differentiates types)
        const movieDownloads = localDownloads.filter(item => item.type === 'movie');
        
        if (movieDownloads.length > 0 && user?.Id && api?.accessToken) {
          try {
            // For each downloaded movie, get the latest metadata from the server
            const moviesWithDetails = await Promise.all(
              movieDownloads.map(async (download) => {
                try {
                  const result = await getItemsApi(api).getItems({
                    userId: user.Id,
                    ids: [download.id]
                  });
                  
                  // Get the first (and only) item from the result
                  const item = result.data.Items?.[0];
                  
                  if (item) {
                    // Merge server data with local download data
                    return {
                      ...item,
                      progress: download.progress,
                      downloadDate: download.downloadDate
                    };
                  } else {
                    throw new Error(`Item not found: ${download.id}`);
                  }
                } catch (error) {
                  console.warn(`Couldn't fetch details for movie ${download.id}:`, error);
                  // Return a minimal item if server fetch fails
                  return {
                    Id: download.id,
                    Name: download.name,
                    progress: download.progress,
                    downloadDate: download.downloadDate,
                    ImageTags: download.imageTag ? { Primary: download.imageTag } : undefined
                  } as BaseItemDto & { progress?: number; downloadDate?: string };
                }
              })
            );
            
            setDownloadedMovies(moviesWithDetails);
          } catch (err) {
            console.error("Error fetching movie details:", err);
            // Create minimal BaseItemDto objects from local data
            const fallbackMovies = movieDownloads.map(download => ({
              Id: download.id,
              Name: download.name,
              progress: download.progress,
              downloadDate: download.downloadDate,
              ImageTags: download.imageTag ? { Primary: download.imageTag } : undefined
            })) as (BaseItemDto & { progress?: number; downloadDate?: string })[];
            
            setDownloadedMovies(fallbackMovies);
          }
        } else if (movieDownloads.length > 0) {
          // No user/API but we have downloads, create minimal objects
          const fallbackMovies = movieDownloads.map(download => ({
            Id: download.id,
            Name: download.name,
            progress: download.progress,
            downloadDate: download.downloadDate,
            ImageTags: download.imageTag ? { Primary: download.imageTag } : undefined
          })) as (BaseItemDto & { progress?: number; downloadDate?: string })[];
          
          setDownloadedMovies(fallbackMovies);
        } else {
          // No downloaded movies
          setDownloadedMovies([]);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error("Error loading downloaded movies:", err);
        setError(err);
        setIsLoading(false);
      }
    };

    fetchDownloadedMovies();
  }, [api, user, loaderData]);

  // Function to delete a download
  const handleDeleteDownload = (movieId: string) => {
    try {
      removeDownloadedItem(movieId);
      
      // Update the UI by removing the deleted movie
      setDownloadedMovies(prevMovies => 
        prevMovies.filter(movie => movie.Id !== movieId)
      );
    } catch (err) {
      console.error("Error deleting download:", err);
      // Handle error (show notification, etc.)
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Container className="downloaded-movies-container">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="downloaded-movies-container">
        <Typography variant="h6" color="error" align="center">
          Error loading downloaded movies
        </Typography>
      </Container>
    );
  }

  // Empty state
  if (!downloadedMovies.length) {
    return (
      <Container className="downloaded-movies-container">
        <Box 
          display="flex" 
          flexDirection="column" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="80vh"
          gap={2}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '4rem' }}>
            download_done
          </span>
          <Typography variant="h5" align="center">
            No downloaded movies
          </Typography>
          <Typography variant="body1" align="center">
            Movies you download will appear here
          </Typography>
        </Box>
      </Container>
    );
  }

  // Content state
  return (
    <Container className="downloaded-movies-container">
      <Typography variant="h4" className="page-title" gutterBottom>
        Downloaded Movies
      </Typography>
      <Grid container spacing={2}>
        {downloadedMovies.map((movie) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={movie.Id}>
            {/* Adjust the props to match your Card component's API */}
            <Card 
              item={movie} 
              onDeleteDownload={() => handleDeleteDownload(movie.Id || "")}
              isDownloaded={true}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}