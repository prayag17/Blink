import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import CircularProgress from "@mui/material/CircularProgress";
import { WebviewWindow as appWindow } from "@tauri-apps/api/webviewWindow";
import React, {
	useCallback,
	useEffect,
	// useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import ReactPlayer from "react-player/lazy";
import { secToTicks, ticksToSec } from "@/utils/date/time";
import { playItemFromQueue, usePlaybackStore } from "@/utils/store/playback";

import "./videoPlayer.scss";

import { PlayMethod, RepeatMode } from "@jellyfin/sdk/lib/generated-client";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import JASSUB from "jassub";
//@ts-ignore
import workerUrl from "jassub/dist/jassub-worker.js?url";
//@ts-ignore
import wasmUrl from "jassub/dist/jassub-worker.wasm?url";
import { PgsRenderer } from "libpgs";
//@ts-ignore
import pgsWorkerUrl from "libpgs/dist/libpgs.worker.js?url";
import type { OnProgressProps } from "react-player/base";
import { useShallow } from "zustand/shallow";
import SkipSegmentButton from "@/components/playback/videoPlayer/buttons/SkipSegmentButton";
import VideoPlayerControls from "@/components/playback/videoPlayer/controls";
import LoadingIndicator from "@/components/playback/videoPlayer/LoadingIndicator";
import VolumeChangeOverlay from "@/components/playback/videoPlayer/VolumeChangeOverlay";
import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop";
import { useCentralStore } from "@/utils/store/central";
import useQueue, { clearQueue } from "@/utils/store/queue";
import type subtitlePlaybackInfo from "@/utils/types/subtitlePlaybackInfo";
//@ts-ignore
import font from "./Noto-Sans-Indosphere.ttf?url";

/**
 * This function is used to add a subtitle track (.vtt and .srt) to the react player instance.
 */
function addSubtitleTrackToReactPlayer(
	videoElem: HTMLMediaElement,
	subtitleTracks: subtitlePlaybackInfo,
	baseUrl: string,
) {
	if (subtitleTracks.url && subtitleTracks.allTracks) {
		const reqSubTrack = subtitleTracks.allTracks.filter(
			(val) => val.Index === subtitleTracks.track,
		);
		const track = document.createElement("track");
		track.src = `${baseUrl}${subtitleTracks.url}`;
		track.kind = "subtitles";
		track.srclang = reqSubTrack[0].Language ?? "en";
		track.label = reqSubTrack[0].DisplayTitle ?? "Subtitle";
		track.default = true;
		track.id = subtitleTracks.url;

		track.addEventListener("load", () => {
			const a = track.track;
			a.mode = "showing";
		});
		track.addEventListener("error", (e) => {
			console.error(e);
		});

		const trackAlreadyExists = videoElem.textTracks.getTrackById(
			subtitleTracks.url,
		);
		if (!trackAlreadyExists?.id) {
			// console.log(trackAlreadyExists.getTrackById(reqSubTrack[0].Index));
			videoElem.appendChild(track);
		}

		for (const i of videoElem.textTracks) {
			if (i.label === reqSubTrack[0].DisplayTitle) {
				i.mode = "showing";
			} else {
				i.mode = "hidden";
			}
		}
	}
}

export function VideoPlayer() {
	const api = useApiInContext((s) => s.api);
	const { history } = useRouter();
	const player = useRef<ReactPlayer | null>(null);

	const user = useCentralStore((s) => s.currentUser);

	const {
		itemId,
		userDataLastPlayedPositionTicks,
		mediaSegments,
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
		nextSegmentIndex,
		activeSegmentId,
		clearActiveSegment,
		setActiveSegment,
		playbackStream,
		setIsBuffering,
		registerPlayerActions,
		toggleIsPlayerFullscreen,
	} = usePlaybackStore(
		useShallow((state) => ({
			itemId: state.metadata.item?.Id,
			userDataLastPlayedPositionTicks:
				state.metadata.userDataLastPlayedPositionTicks,
			mediaSegments: state.metadata.mediaSegments,
			setCurrentTime: state.setCurrentTime,
			volume: state.playerState.volume,
			isPlayerPlaying: state.playerState.isPlayerPlaying,
			isPlayerMuted: state.playerState.isPlayerMuted,
			isPlayerReady: state.playerState.isPlayerReady,

			setPlayerReady: state.setPlayerReady,
			mediaSource: state.mediaSource,
			playsessionId: state.playsessionId,
			toggleIsPlaying: state.toggleIsPlaying,
			toggleIsPlayerMuted: state.toggleIsPlayerMuted,
			toggleIsPlayerFullscreen: state.toggleIsPlayerFullscreen,
			nextSegmentIndex: state.nextSegmentIndex,
			activeSegmentId: state.activeSegmentId,
			clearActiveSegment: state.clearActiveSegment,
			setActiveSegment: state.setActiveSegment,
			playbackStream: state.playbackStream,
			setIsBuffering: state.setIsBuffering,
			registerPlayerActions: state.registerPlayerActions,
		})),
	);

	const [currentQueueItemIndex, queue] = useQueue((s) => [
		s.currentItemIndex,
		s.tracks,
	]);

	const setBackdrop = useBackdropStore((s) => s.setBackdrop);
	useEffect(() => setBackdrop("", ""), []);

	const handleReady = async () => {
		if (api && !isPlayerReady && player.current) {
			player.current.seekTo(
				ticksToSec(userDataLastPlayedPositionTicks ?? 0),
				"seconds",
			);
			registerPlayerActions({
				seekTo: (seconds: number) => {
					const internalPlayer = player.current;
					internalPlayer?.seekTo(seconds, "seconds");
					console.log("Seeking to", seconds, "seconds");
					// If you want to report the seek action
					// if (internalPlayer && typeof internalPlayer.seekTo === "function") {
					// }
				},
				getCurrentTime: () => {
					const internalPlayer = player.current;
					if (
						internalPlayer &&
						typeof internalPlayer.getCurrentTime === "function"
					) {
						return internalPlayer.getCurrentTime();
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
					PlayMethod: PlayMethod.DirectPlay,
					PlaySessionId: playsessionId,
					PlaybackStartTimeTicks: userDataLastPlayedPositionTicks,
					PositionTicks: userDataLastPlayedPositionTicks,
					RepeatMode: RepeatMode.RepeatNone,
					VolumeLevel: Math.floor(volume * 100),
				},
			});
		}
	};

	const handleProgress = useCallback(
		async (event: OnProgressProps) => {
			const ticks = secToTicks(event.playedSeconds);

			if (activeSegmentId) {
				const activeSegment = mediaSegments?.Items?.find(
					(s) => s.Id === activeSegmentId,
				);
				// If the current time is past the active segment's end time, clear it.
				if (activeSegment && ticks > (activeSegment.EndTicks ?? ticks)) {
					clearActiveSegment();
				}
			}

			if (nextSegmentIndex !== -1) {
				const nextSegment = mediaSegments?.Items?.[nextSegmentIndex];
				if (nextSegment && ticks >= (nextSegment.StartTicks ?? ticks)) {
					clearActiveSegment();
					setActiveSegment(nextSegmentIndex);
				}
			}

			setCurrentTime(secToTicks(event.playedSeconds));
			if (!api) {
				console.warn("API is not available, cannot report playback progress.");
				return;
			}

			// Report Jellyfin server: Playback progress
			getPlaystateApi(api).reportPlaybackProgress({
				playbackProgressInfo: {
					AudioStreamIndex: mediaSource.audioTrack,
					CanSeek: true,
					IsMuted: isPlayerMuted,
					IsPaused: player.current?.getInternalPlayer()?.paused,
					ItemId: itemId,
					MediaSourceId: mediaSource.id,
					PlayMethod: PlayMethod.DirectPlay,
					PlaySessionId: playsessionId,
					PlaybackStartTimeTicks: userDataLastPlayedPositionTicks,
					PositionTicks: secToTicks(event.playedSeconds),
					RepeatMode: RepeatMode.RepeatNone,
					VolumeLevel: Math.floor(volume * 100),
				},
			});
		},
		[setCurrentTime],
	);

	const handleExitPlayer = useCallback(async () => {
		appWindow.getCurrent().setFullscreen(false);

		history.back();
		if (!api) {
			throw Error("API is not available, cannot report playback stopped.");
		}
		// Report Jellyfin server: Playback has ended/stopped
		/* getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				Failed: false,
				ItemId: itemId,
				MediaSourceId: mediaSource.id,
				PlaySessionId: playsessionId,
				PositionTicks: secToTicks(player.current?.getCurrentTime() ?? 0),
			},
		}); */
		usePlaybackStore.setState(usePlaybackStore.getInitialState());
		clearQueue();
	}, []);

	const handleKeyPress = useCallback(
		(event: KeyboardEvent) => {
			if (player.current) {
				event.preventDefault();
				switch (event.key) {
					case "ArrowRight":
						player.current.seekTo(player.current.getCurrentTime() + 10);
						break;
					case "ArrowLeft":
						player.current.seekTo(player.current.getCurrentTime() - 10);
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
		},
		[player.current?.seekTo],
	);

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
		if (player.current?.getInternalPlayer() && mediaSource.subtitle.enable) {
			let jassubRenderer: JASSUB | undefined;
			let pgsRenderer: PgsRenderer | undefined;
			if (
				mediaSource.subtitle.format === "ass" ||
				mediaSource.subtitle.format === "ssa"
			) {
				jassubRenderer = new JASSUB({
					//@ts-ignore
					video: player.current?.getInternalPlayer(),
					workerUrl,
					wasmUrl,
					subUrl: `${api?.basePath}${mediaSource.subtitle.url}`,
					availableFonts: { "noto sans": font },
					fallbackFont: "noto sans",
				});
			} else if (
				mediaSource.subtitle.format === "subrip" ||
				mediaSource.subtitle.format === "vtt"
			) {
				addSubtitleTrackToReactPlayer(
					player.current.getInternalPlayer() as HTMLMediaElement,
					mediaSource.subtitle,
					api?.basePath ?? "",
				);
			} else if (mediaSource.subtitle.format === "PGSSUB") {
				pgsRenderer = new PgsRenderer({
					workerUrl: pgsWorkerUrl,
					video: player.current?.getInternalPlayer() as any,
					subUrl: `${api?.basePath}${mediaSource.subtitle.url}`,
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
		if (
			player.current?.getInternalPlayer() &&
			mediaSource.subtitle.enable === false
		) {
			// @ts-ignore internalPlayer here provides the HTML video player element
			const videoElem: HTMLMediaElement =
				player.current.getInternalPlayer() as HTMLMediaElement;
			for (const i of videoElem.textTracks) {
				i.mode = "hidden";
			}
		}
	}, [mediaSource.subtitle?.track, mediaSource.subtitle?.enable]);

	// const chapterMarks = useMemo(() => {
	// 	const marks: { value: number }[] = [];
	// 	item?.Chapters?.map((val) => {
	// 		marks.push({ value: val.StartPositionTicks ?? 0 });
	// 	});
	// 	return marks;
	// }, [item?.Chapters]);

	const handlePlaybackEnded = useCallback(() => {
		if (queue?.length !== currentQueueItemIndex + 1) {
			playItemFromQueue("next", user?.Id, api);
		} else {
			handleExitPlayer(); // Exit player if playback has finished and the queue is empty
		}
	}, []);

	// useEffect(() => {
	// 	async function setVolumeInServer() {
	// 		if (!api) return null;
	// 		await getDisplayPreferencesApi(api).updateDisplayPreferences({
	// 			userId: user?.Id,
	// 			client: "blink",
	// 			displayPreferencesId: api.deviceInfo.id,
	// 			displayPreferencesDto: {
	// 				CustomPrefs: {
	// 					Volume: String(playerVolume),
	// 				},
	// 			},
	// 		});
	// 	}
	// 	if (user?.Id && initVolume !== playerVolume && initVolume !== undefined) {
	// 		setVolumeInServer();
	// 	}
	// }, [playerVolume]);

	const [areControlsVisible, setAreControlsVisible] = useState(false);
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
			setAreControlsVisible(false);
		}, 3000);
	}, [clearIdleTimer]);

	// --- Event Handlers for the main player wrapper ---

	const handleMouseMove = useCallback(() => {
		// When the mouse moves, show the controls and restart the idle timer.
		setAreControlsVisible(true);
		startIdleTimer();
	}, [startIdleTimer]);

	const handleMouseLeave = useCallback(() => {
		// When the mouse leaves the player, clear the timer and hide the controls.
		clearIdleTimer();
		setAreControlsVisible(false);
	}, [clearIdleTimer]);

	const playerConfig = useMemo(
		() => ({
			file: {
				attributes: {
					crossOrigin: "anonymous",
					preload: "metadata",
				},
				tracks: [],
			},
		}),
		[],
	);

	const handleOnBuffer = useCallback(() => {
		setIsBuffering(true);
	}, [setIsBuffering]);
	const handleOnBufferEnd = useCallback(() => {
		setIsBuffering(false);
	}, [setIsBuffering]);

	const handleError = useCallback(
		(error: any, data: any, hls: any, hlsG: any) => {
			console.error(error.target.error);
			console.error(data);
			console.error(hls);
			console.error(hlsG);
		},
		[],
	);

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
			<VideoPlayerControls
				isVisible={areControlsVisible}
				onHover={handleMouseMove}
				onLeave={handleMouseLeave}
			/>
			<SkipSegmentButton />
			<VolumeChangeOverlay />

			<ReactPlayer
				key={playsessionId}
				playing={isPlayerPlaying}
				url={playbackStream}
				ref={player}
				onReady={handleReady}
				onProgress={handleProgress}
				onError={handleError}
				onEnded={handlePlaybackEnded}
				width="100vw"
				height="100vh"
				style={{
					position: "fixed",
					zIndex: 1,
				}}
				volume={isPlayerMuted ? 0 : volume}
				onBuffer={handleOnBuffer}
				onBufferEnd={handleOnBufferEnd}
				playsinline
				config={playerConfig}
			/>
		</div>
	);
}

export const Route = createFileRoute("/_api/player/")({
	component: VideoPlayer,
});
