import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import CircularProgress from "@mui/material/CircularProgress";
import { WebviewWindow as appWindow } from "@tauri-apps/api/webviewWindow";
import React, { useCallback, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { secToTicks, ticksToSec } from "@/utils/date/time";
import { playItemFromQueue, usePlaybackStore } from "@/utils/store/playback";

import "./videoPlayer.scss";

import { RepeatMode } from "@jellyfin/sdk/lib/generated-client";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import JASSUB from "jassub";
// @ts-expect-error
import wasmUrl from "jassub/dist/wasm/jassub-worker.wasm?url"; // non-SIMD fallback
// @ts-expect-error
import modernWasmUrl from "jassub/dist/wasm/jassub-worker-modern.wasm?url"; // SIMD
// @ts-expect-error
import workerUrl from "jassub/dist/worker/worker.js?url"; // Web Worker
import { PgsRenderer } from "libpgs";
//@ts-expect-error
import pgsWorkerUrl from "libpgs/dist/libpgs.worker.js?url";
// import type { OnProgressProps } from "react-player";
import { useShallow } from "zustand/shallow";
import SkipSegmentButton from "@/components/playback/videoPlayer/buttons/SkipSegmentButton";
import VideoPlayerControls from "@/components/playback/videoPlayer/controls";
import ErrorDisplay from "@/components/playback/videoPlayer/ErrorDisplay";
import LoadingIndicator from "@/components/playback/videoPlayer/LoadingIndicator";
import StatsForNerds from "@/components/playback/videoPlayer/StatsForNerds";
import UpNextFlyout from "@/components/playback/videoPlayer/upNextFlyout";
import VolumeChangeOverlay from "@/components/playback/videoPlayer/VolumeChangeOverlay";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop";
import { useCentralStore } from "@/utils/store/central";
import useQueue, { clearQueue } from "@/utils/store/queue";
import type subtitlePlaybackInfo from "@/utils/types/subtitlePlaybackInfo";
//@ts-expect-error
import font from "./Noto-Sans-Indosphere.ttf?url";

/**
 * This function is used to add a subtitle track (.vtt and .srt) to the react player instance.
 */
function addSubtitleTrackToReactPlayer(
	videoElem: HTMLMediaElement,
	subtitleTracks: subtitlePlaybackInfo,
	baseUrl: string,
	apiKey?: string,
) {
	if (subtitleTracks.url && subtitleTracks.allTracks) {
		const reqSubTrack = subtitleTracks.allTracks.find(
			(val) => val.Index === subtitleTracks.track,
		);
		if (!reqSubTrack) return;

		// Remove existing tracks to ensure clean state
		const existingTracks = videoElem.querySelectorAll("track");
		existingTracks.forEach((t) => {
			t.remove();
		});

		const track = document.createElement("track");
		const separator = subtitleTracks.url.includes("?") ? "&" : "?";
		const urlParams = apiKey ? `${separator}api_key=${apiKey}` : "";
		track.src = `${baseUrl}${subtitleTracks.url}${urlParams}`;
		track.kind = "subtitles";
		track.srclang = reqSubTrack.Language ?? "en";
		track.label = reqSubTrack.DisplayTitle ?? "Subtitle";
		track.default = true;
		track.id = subtitleTracks.url;

		track.addEventListener("load", () => {
			const a = track.track;
			a.mode = "showing";
		});
		track.addEventListener("error", (e) => {
			console.error("Error loading subtitle track", e);
		});

		videoElem.appendChild(track);
		if (track.track) {
			track.track.mode = "showing";
		}
	}
}

export function VideoPlayer() {
	const api = useApiInContext((s) => s.api);
	const { history } = useRouter();
	const player = useRef<HTMLVideoElement | null>(null);

	const user = useCentralStore((s) => s.currentUser);

	const {
		itemId,
		userDataLastPlayedPositionTicks,
		// mediaSegments,
		setCurrentTime,
		volume,
		isPlayerPlaying,
		isPlayerMuted,
		isPlayerReady,
		setPlayerReady,
		mediaSource,
		playsessionId,
		toggleIsPlaying,
		toggleIsPlayerMuted,
		// nextSegmentIndex,
		// activeSegmentId,
		clearActiveSegment,
		// setActiveSegment,
		playbackStream,
		setIsBuffering,
		registerPlayerActions,
		toggleIsPlayerFullscreen,
		setIsUserHovering,
		handleOnSeek,
		itemName,
		isEpisode,
		episodeTitle,
		initializeVolume,
	} = usePlaybackStore(
		useShallow((state) => ({
			itemId: state.metadata.item?.Id,
			userDataLastPlayedPositionTicks:
				state.metadata.userDataLastPlayedPositionTicks,
			// mediaSegments: state.metadata.mediaSegments,
			setCurrentTime: state.setCurrentTime,
			volume: state.playerState.volume,
			isPlayerPlaying: state.playerState.isPlayerPlaying,
			isPlayerMuted: state.playerState.isPlayerMuted,
			isPlayerReady: state.playerState.isPlayerReady,
			itemName: state.metadata.item?.Name,
			isEpisode: state.metadata.isEpisode,
			episodeTitle: state.metadata.episodeTitle,

			setPlayerReady: state.setPlayerReady,
			mediaSource: state.mediaSource,
			playsessionId: state.playsessionId,
			toggleIsPlaying: state.toggleIsPlaying,
			toggleIsPlayerMuted: state.toggleIsPlayerMuted,
			toggleIsPlayerFullscreen: state.toggleIsPlayerFullscreen,
			// nextSegmentIndex: state.nextSegmentIndex,
			// activeSegmentId: state.activeSegmentId,
			clearActiveSegment: state.clearActiveSegment,
			// setActiveSegment: state.setActiveSegment,
			playbackStream: state.playbackStream,
			setIsBuffering: state.setIsBuffering,
			registerPlayerActions: state.registerPlayerActions,
			setIsUserHovering: state.setIsUserHovering,
			handleOnSeek: state.handleOnSeek,
			initializeVolume: state.initializeVolume,
		})),
	);

	useEffect(() => {
		initializeVolume();
	}, [initializeVolume]);

	const [currentQueueItemIndex, queue] = useQueue((s) => [
		s.currentItemIndex,
		s.tracks,
	]);

	const [error, setError] = React.useState<any>(null);

	const setBackdrop = useBackdropStore(useShallow((s) => s.setBackdrop));
	useEffect(() => setBackdrop(""), []);

	const handlePlayNext = useMutation({
		mutationKey: ["playNextButton"],
		mutationFn: () => playItemFromQueue("next", user?.Id, api),
		onError: (error) => console.error(error),
	});
	const handlePlayPrev = useMutation({
		mutationKey: ["playPreviousButton"],
		mutationFn: () => playItemFromQueue("previous", user?.Id, api),
		onError: (error) => [console.error(error)],
	});

	const handleReady = async () => {
		if (api && !isPlayerReady && player.current) {
			player.current.currentTime = ticksToSec(
				userDataLastPlayedPositionTicks ?? 0,
			);

			if (navigator.mediaSession && mediaSource) {
				navigator.mediaSession.metadata = new MediaMetadata({
					title: isEpisode
						? `${itemName} - ${episodeTitle}`
						: (itemName ?? "Blink"),
					album: isEpisode ? (itemName ?? "Blink") : undefined,
					artwork: [
						{
							src: getImageUrlsApi(api).getItemImageUrlById(
								itemId ?? "",
								"Primary",
								{
									quality: 80,
								},
							),
							sizes: "512x512",
							type: "image/png",
						},
					],
				});
				navigator.mediaSession.setActionHandler("play", () => {
					toggleIsPlaying();
				});
				navigator.mediaSession.setActionHandler("pause", () => {
					toggleIsPlaying();
				});
				navigator.mediaSession.setActionHandler("stop", () => {
					handleExitPlayer();
				});
				navigator.mediaSession.setActionHandler("nexttrack", () => {
					if (queue?.length !== currentQueueItemIndex + 1) {
						handlePlayNext.mutate();
					} else {
						console.warn("No next item in the queue");
					}
				});
				navigator.mediaSession.setActionHandler("previoustrack", () => {
					if (currentQueueItemIndex > 0) {
						handlePlayPrev.mutate();
					} else {
						console.warn("No previous item in the queue");
					}
				});
			}

			console.log(mediaSource.subtitle);

			registerPlayerActions({
				seekTo: (seconds: number) => {
					const internalPlayer = player.current;
					if (internalPlayer) {
						internalPlayer.currentTime = seconds;
						console.log("Seeking to", seconds, "seconds");
					} else {
						console.warn("ReactPlayer is not ready yet");
					}
				},
				getCurrentTime: () => {
					const internalPlayer = player.current;
					if (internalPlayer) {
						return internalPlayer.currentTime ?? 0;
					}
					console.warn("ReactPlayer is not ready yet");
					return 0;
				},
			});
			setPlayerReady(true);

			// Report Jellyfin server: Playback has begin
			getPlaystateApi(api).reportPlaybackStart({
				playbackStartInfo: {
					AudioStreamIndex: mediaSource.audioTrack,
					CanSeek: true,
					IsMuted: false,
					IsPaused: false,
					ItemId: itemId,
					MediaSourceId: mediaSource.id,
					PlayMethod: mediaSource.playMethod,
					PlaySessionId: playsessionId,
					PlaybackStartTimeTicks: userDataLastPlayedPositionTicks,
					PositionTicks: userDataLastPlayedPositionTicks,
					RepeatMode: RepeatMode.RepeatNone,
					VolumeLevel: Math.floor(volume * 100),
				},
			});
		}
	};

	const lastReportTimeRef = useRef<number>(0);

	const handleTimeUpdate = useCallback(async () => {
		if (!player.current) return;

		const currentTime = player.current.currentTime ?? 0;

		const ticks = secToTicks(currentTime);
		const now = Date.now();

		setCurrentTime(ticks);

		if (!api) {
			console.warn("API is not available, cannot report playback progress.");
			return;
		}

		// Report to server every 10s
		if (now - lastReportTimeRef.current < 10000) {
			return;
		}
		lastReportTimeRef.current = now;

		// Report Jellyfin server: Playback progress
		getPlaystateApi(api).reportPlaybackProgress({
			playbackProgressInfo: {
				AudioStreamIndex: mediaSource.audioTrack,
				CanSeek: true,
				IsMuted: isPlayerMuted,
				IsPaused: !isPlayerPlaying,
				ItemId: itemId,
				MediaSourceId: mediaSource.id,
				PlayMethod: mediaSource.playMethod,
				PlaySessionId: playsessionId,
				PlaybackStartTimeTicks: userDataLastPlayedPositionTicks,
				PositionTicks: ticks,
				RepeatMode: RepeatMode.RepeatNone,
				VolumeLevel: Math.floor(volume * 100),
			},
		});
	}, [
		setCurrentTime,
		api,
		mediaSource,
		isPlayerMuted,
		isPlayerPlaying,
		itemId,
		playsessionId,
		userDataLastPlayedPositionTicks,
		volume,
	]);

	const handlePause = useCallback(async () => {
		if (!api) {
			console.warn("API is not available, cannot report playback paused.");
			return;
		}
		let currentTime = 0;
		if (player.current) {
			currentTime = player.current.currentTime ?? 0;
		}
		// Report Jellyfin server: Playback has been paused

		getPlaystateApi(api).reportPlaybackProgress({
			playbackProgressInfo: {
				AudioStreamIndex: mediaSource.audioTrack,
				CanSeek: true,
				IsMuted: isPlayerMuted,
				IsPaused: true,
				ItemId: itemId,
				MediaSourceId: mediaSource.id,
				PlayMethod: mediaSource.playMethod,
				PlaySessionId: playsessionId,
				PlaybackStartTimeTicks: userDataLastPlayedPositionTicks,
				PositionTicks: secToTicks(currentTime),
				RepeatMode: RepeatMode.RepeatNone,
				VolumeLevel: Math.floor(volume * 100),

			},
		});
	}, [setCurrentTime,
		api,
		mediaSource,
		isPlayerMuted,
		isPlayerPlaying,
		itemId,
		playsessionId,
		userDataLastPlayedPositionTicks,
		volume,]);


	const handleExitPlayer = useCallback(async () => {
		appWindow.getCurrent().setFullscreen(false);

		history.back();
		if (!api) {
			throw Error("API is not available, cannot report playback stopped.");
		}
		let currentTime = 0;
		if (player.current) {
			currentTime = player.current.currentTime ?? 0;
		}

		// Report Jellyfin server: Playback has ended/stopped
		getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				Failed: false,
				ItemId: itemId,
				MediaSourceId: mediaSource.id,
				PlaySessionId: playsessionId,
				PositionTicks: secToTicks(currentTime),
			},
		});
		usePlaybackStore.setState(usePlaybackStore.getInitialState());
		clearQueue();
	}, []);

	const handleKeyPress = useCallback((event: KeyboardEvent) => {
		if (player.current) {
			event.preventDefault();
			const currentTime = player.current.currentTime ?? 0;

			const seekTo = (time: number) => {
				if (player.current) {
					player.current.currentTime = time;
				}
			};

			switch (event.key) {
				case "ArrowRight":
					seekTo(currentTime + 10);
					break;
				case "ArrowLeft":
					seekTo(currentTime - 10);
					break;
				case "F8":
				case " ":
					toggleIsPlaying();
					break;
				case "ArrowUp":
					// setVolume((state) => (state <= 0.9 ? state + 0.1 : state));
					break;
				case "ArrowDown":
					// setVolume((state) => (state >= 0.1 ? state - 0.1 : state));
					break;
				case "F":
				case "f":
					toggleIsPlayerFullscreen();
					break;
				case "P":
				case "p":
					// setIsPIP((state) => !state);
					break;
				case "M":
				case "m":
					toggleIsPlayerMuted();
					break;
				case "F7":
					playItemFromQueue("previous", user?.Id, api);
					break;
				case "F9":
					playItemFromQueue("next", user?.Id, api);
					break;
				default:
					break;
			}
		}
	}, []);

	useEffect(() => {
		// attach the event listener
		document.addEventListener("keydown", handleKeyPress);

		// remove the event listener
		return () => {
			document.removeEventListener("keydown", handleKeyPress);
		};
	}, [handleKeyPress]);

	// Manage Subtitle playback
	useEffect(() => {
		if (player.current && mediaSource.subtitle.enable) {
			const internalPlayer = player.current;

			if (!internalPlayer) return;

			let jassubRenderer: JASSUB | undefined;
			let pgsRenderer: PgsRenderer | undefined;
			const apiKey = api?.accessToken;
			const separator = mediaSource.subtitle.url?.includes("?") ? "&" : "?";
			const urlParams = apiKey ? `${separator}api_key=${apiKey}` : "";

			if (
				mediaSource.subtitle.format === "ass" ||
				mediaSource.subtitle.format === "ssa"
			) {
				jassubRenderer = new JASSUB({
					video: internalPlayer,
					subUrl: `${api?.basePath}${mediaSource.subtitle.url}`,
					availableFonts: { "noto sans": font },
					defaultFont: "noto sans",
					workerUrl,
					wasmUrl,
					modernWasmUrl,
				});
				jassubRenderer.ready.then(() => {
					console.log("JASSUB subtitle renderer is ready");
				});
			} else if (
				mediaSource.subtitle.format === "subrip" ||
				mediaSource.subtitle.format === "vtt"
			) {
				addSubtitleTrackToReactPlayer(
					internalPlayer,
					mediaSource.subtitle,
					api?.basePath ?? "",
					apiKey,
				);
			} else if (mediaSource.subtitle.format === "PGSSUB") {
				pgsRenderer = new PgsRenderer({
					workerUrl: pgsWorkerUrl,
					video: internalPlayer,
					subUrl: `${api?.basePath}${mediaSource.subtitle.url}${urlParams}`,
				});
			}
			return () => {
				if (jassubRenderer) {
					jassubRenderer.destroy();
				} // Remove JASSUB renderer when track changes to fix duplicate renders
				if (pgsRenderer) {
					pgsRenderer.dispose();
				}
			};
		}
		if (player.current && mediaSource.subtitle.enable === false) {
			const internalPlayer = player.current;

			if (internalPlayer?.textTracks) {
				for (const i of internalPlayer.textTracks) {
					i.mode = "hidden";
				}
			}
		}
	}, [
		mediaSource.subtitle?.track,
		mediaSource.subtitle?.enable,
		isPlayerReady,
		api,
	]);

	const handlePlaybackEnded = useCallback(() => {
		if (queue?.length !== currentQueueItemIndex + 1) {
			clearActiveSegment(); // Clear active segment when playback ends
			playItemFromQueue("next", user?.Id, api);
		} else {
			handleExitPlayer(); // Exit player if playback has finished and the queue is empty
		}
	}, []);

	const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Function to clear the existing idle timer
	const clearIdleTimer = useCallback(() => {
		if (idleTimerRef.current) {
			clearTimeout(idleTimerRef.current);
		}
	}, []);

	// Function to start a new idle timer
	const startIdleTimer = useCallback(() => {
		// Clear any old timer before starting a new one
		clearIdleTimer();
		// Set a timer to hide the controls after 3 seconds of inactivity
		idleTimerRef.current = setTimeout(() => {
			setIsUserHovering(false);
		}, 3000);
	}, [clearIdleTimer]);

	// --- Event Handlers for the main player wrapper ---

	const handleMouseMove = useCallback(() => {
		// When the mouse moves, show the controls and restart the idle timer.
		setIsUserHovering(true);
		startIdleTimer();
	}, [startIdleTimer]);

	const handleMouseLeave = useCallback(() => {
		// When the mouse leaves the player, clear the timer and hide the controls.
		clearIdleTimer();
		setIsUserHovering(false);
	}, [clearIdleTimer]);

	const handleOnBuffer = useCallback(() => {
		setIsBuffering(true);
	}, [setIsBuffering]);
	const handleOnBufferEnd = useCallback(() => {
		setIsBuffering(false);
	}, [setIsBuffering]);

	const handleError = useCallback((e: any) => {
		console.error("Video playback error:", e);
		setError(e);
	}, []);

	if (!playbackStream) {
		return (
			<div className="video-player">
				<CircularProgress
					size={72}
					thickness={1.4}
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
					}}
				/>
			</div>
		);
	}

	return (
		<div
			className="video-player"
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		>
			<LoadingIndicator />
			<ErrorDisplay
				error={error}
				onExit={handleExitPlayer}
				onRetry={() => {
					setError(null);
					if (player.current) {
						// Try to reload the video
						if (typeof player.current.load === "function") {
							player.current.load();
						}
					}
				}}
			/>
			<StatsForNerds playerRef={player as any} />
			<VideoPlayerControls
				// isVisible={areControlsVisible}
				onHover={handleMouseMove}
				onLeave={handleMouseLeave}
			/>
			<SkipSegmentButton />
			<VolumeChangeOverlay />
			<UpNextFlyout />

			<ReactPlayer
				key={playsessionId}
				playing={isPlayerPlaying}
				src={playbackStream}
				ref={player}
				onReady={handleReady}
				onTimeUpdate={handleTimeUpdate}
				onPause={handlePause}
				onPlay={handleTimeUpdate}
				onError={handleError}
				onEnded={handlePlaybackEnded}
				width="100vw"
				height="100vh"
				style={{
					position: "fixed",
					zIndex: 0,
				}}
				volume={isPlayerMuted ? 0 : volume}
				onWaiting={handleOnBuffer}
				onPlaying={handleOnBufferEnd}
				onSeeking={(e) => handleOnSeek(e.currentTarget.currentTime)}
				playsInline
				crossOrigin="anonymous"
			/>
		</div>
	);
}

export const Route = createFileRoute("/_api/player/")({
	component: VideoPlayer,
});
