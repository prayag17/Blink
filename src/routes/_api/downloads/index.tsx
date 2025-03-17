// Fix the import path to your card component
import { Card } from "@/components/card/card";
import { type DownloadedItem, getUserDownloadedItems } from "@/utils/storage/downloads";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { usePlaybackStore } from "@/utils/store/playback";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { Box, CircularProgress, Container, Grid, Typography } from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./downloads.scss";

// Define proper route path that matches your router configuration
export const Route = createFileRoute('/_api/downloads/')({
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

// Define interface for downloaded movie items
interface DownloadedMovieItem extends BaseItemDto {
  progress?: number;
  downloadDate?: string;
  localFilePath?: string; // Add field for local file path
}

// The component to render
function DownloadedMoviesPage() {
  const api = useApiInContext((s) => s.api);
  const user = useCentralStore((s) => s.currentUser);
  const loaderData = Route.useLoaderData();
  const [downloadedMovies, setDownloadedMovies] = useState<DownloadedMovieItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const setPlaybackInfo = usePlaybackStore((s) => s.setPlaybackInfo);

  useEffect(() => {
    const fetchDownloadedMovies = async () => {
      try {
        setIsLoading(true);
        
        // Get locally stored downloaded movies from the loader data
        const localDownloads: DownloadedItem[] = loaderData?.downloadedItems || [];
        
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
                      downloadDate: download.downloadDate,
                      localFilePath: download.filePath // Add local file path
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
                    localFilePath: download.filePath, // Add local file path
                    ImageTags: download.imageTag ? { Primary: download.imageTag } : undefined
                  } as DownloadedMovieItem;
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
              localFilePath: download.filePath, // Add local file path
              ImageTags: download.imageTag ? { Primary: download.imageTag } : undefined
            })) as DownloadedMovieItem[];
            
            setDownloadedMovies(fallbackMovies);
          }
        } else if (movieDownloads.length > 0) {
          // No user/API but we have downloads, create minimal objects
          const fallbackMovies = movieDownloads.map(download => ({
            Id: download.id,
            Name: download.name,
            progress: download.progress,
            downloadDate: download.downloadDate,
            localFilePath: download.filePath, // Add local file path
            ImageTags: download.imageTag ? { Primary: download.imageTag } : undefined
          })) as DownloadedMovieItem[];
          
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

  // Function to play a local file
  const playLocalVideo = (movie: DownloadedMovieItem) => {
    if (!movie.localFilePath) {
      console.error("No local file path available for this movie");
      return;
    }

    // Generate a unique session ID for this playback
    const sessionId = uuidv4();
    
    // Set up playback info in the store
    setPlaybackInfo({
      playbackStream: `file://${movie.localFilePath}`, // Use file:// protocol for local files
      item: movie,
      itemName: movie.Name || "Unknown",
      itemDuration: movie.RunTimeTicks || 0,
      startPosition: movie.UserData?.PlaybackPositionTicks || 0,
      episodeTitle: "",
      mediaSource: {
        id: movie.Id || "",
        subtitle: {
          enable: false,
          track: -1,
          format: "subrip",
          url: "",
          allTracks: []
        },
        audio: {
          track: 0,
          allTracks: []
        },
        playMethod: "DirectPlay", // Set to DirectPlay for local files
        isLocal: true // Flag to indicate this is a local file
      },
      playsessionId: sessionId,
      intro: null
    });

    // Navigate to the player
    navigate({ to: "/player" });
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
            <Card 
              item={movie}
              cardTitle={movie.Name || ""}
              cardCaption={movie.Overview || ""}
              imageType="Primary"
              cardType="portrait"
              overrideIcon="Movie"
              onClick={() => playLocalVideo(movie)}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}