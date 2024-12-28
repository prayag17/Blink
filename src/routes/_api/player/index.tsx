import { WebviewWindow as appWindow } from "@tauri-apps/api/webviewWindow";
import React, {
	type ChangeEventHandler,
	type MouseEventHandler,
	useTransition,
} from "react";
import { useLayoutEffect, useMemo } from "react";

import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";

import ReactPlayer from "react-player/lazy";

import {
	changeAudioTrack,
	changeSubtitleTrack,
	playItemFromQueue,
	toggleSubtitleTrack,
	usePlaybackStore,
} from "@/utils/store/playback";

import { secToTicks, ticksToMs, ticksToSec } from "@/utils/date/time";
import { useCallback, useEffect, useRef, useState } from "react";

import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";

import "./videoPlayer.scss";

import { endsAt } from "@/utils/date/time";

import {
	PlayMethod,
	RepeatMode,
	type TrickplayInfo,
} from "@jellyfin/sdk/lib/generated-client";
import { AnimatePresence, motion } from "framer-motion";

import { useBackdropStore } from "@/utils/store/backdrop";

import {
	Button,
	LinearProgress,
	Popover,
	TextField,
	Tooltip,
} from "@mui/material";
import JASSUB from "jassub";
//@ts-ignore
import workerUrl from "jassub/dist/jassub-worker.js?url";
//@ts-ignore
import wasmUrl from "jassub/dist/jassub-worker.wasm?url";

import PlayNextButton from "@/components/buttons/playNextButton";
import PlayPreviousButton from "@/components/buttons/playPreviousButtom";
import QueueButton from "@/components/buttons/queueButton";
import OutroCard from "@/components/outroCard";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import useQueue, { clearQueue } from "@/utils/store/queue";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toNumber } from "lodash";
import type { OnProgressProps } from "react-player/base";

import type subtitlePlaybackInfo from "@/utils/types/subtitlePlaybackInfo";
import type { Instance } from "@popperjs/core";
//@ts-ignore
import font from "./Noto-Sans-Indosphere.ttf?url";

const ticksDisplay = (ticks: number) => {
	const time = Math.round(ticks / 10000);
	let formatedTime = "";
	let timeSec = Math.floor(time / 1000);
	let timeMin = Math.floor(timeSec / 60);
	timeSec -= timeMin * 60;
	timeSec = timeSec === 0 ? 0o0 : timeSec;
	const timeHr = Math.floor(timeMin / 60);
	timeMin -= timeHr * 60;
	formatedTime = `${timeHr.toLocaleString([], {
		minimumIntegerDigits: 2,
		useGrouping: false,
	})}:${timeMin.toLocaleString([], {
		minimumIntegerDigits: 2,
		useGrouping: false,
	})}:${timeSec.toLocaleString([], {
		minimumIntegerDigits: 2,
		useGrouping: false,
	})}`;
	return formatedTime;
};
const VOLUME_SCROLL_INTERVAL = 0.02;

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

export const Route = createFileRoute("/_api/player/")({
	component: VideoPlayer,
});

function VideoPlayer() {
	const api = useApiInContext((s) => s.api);
	const { history } = useRouter();
	const [hoveringOsd, setHoveringOsd] = useState(false);
	const player = useRef<ReactPlayer | null>(null);

	const user = useCentralStore((s) => s.currentUser);

	const [
		playbackStream,
		item,
		itemName,
		itemDuration,
		startPosition,
		episodeTitle,
		mediaSource,
		playsessionId,
		mediaSegments,
	] = usePlaybackStore((state) => [
		state.playbackStream,
		state.item,
		state.itemName,
		state.itemDuration,
		state.startPosition,
		state.episodeTitle,
		state.mediaSource,
		state.playsessionId,
		state.intro,
	]);

	const introInfo = mediaSegments?.Items?.find(
		(segment) => segment.Type === "Intro",
	);

	const creditInfo = mediaSegments?.Items?.find(
		(segment) => segment.Type === "Outro",
	);

	const recapInfo = mediaSegments?.Items?.find(
		(segment) => segment.Type === "Recap",
	);

	const [currentQueueItemIndex, queue] = useQueue((s) => [
		s.currentItemIndex,
		s.tracks,
	]);

	const [loading, setLoading] = useState(true);
	const [settingsMenu, setSettingsMenu] = useState<HTMLButtonElement | null>(
		null,
	);
	const settingsMenuOpen = Boolean(settingsMenu);
	const [showVolumeControl, setShowVolumeControl] = useState(false);

	// Control States
	const [isReady, setIsReady] = useState(false);
	const [playing, setPlaying] = useState(true);
	const [isSeeking, setIsSeeking] = useState(false);
	const [sliderProgress, setSliderProgress] = useState(startPosition);
	const [progress, setProgress] = useState(startPosition);
	const [appFullscreen, setAppFullscreen] = useState(false);
	// const [showSubtitles, setShowSubtitles] = useState(mediaSource.subtitle.enable);
	const [volume, setVolume] = useState(1);
	const [muted, setMuted] = useState(false);

	const setBackdrop = useBackdropStore((s) => s.setBackdrop);
	useEffect(() => setBackdrop("", ""), []);

	const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout>(null!);

	const handleReady = async () => {
		if (api && !isReady) {
			player.current?.seekTo(ticksToSec(startPosition), "seconds");
			console.log("Seeking to", ticksToSec(startPosition));
			setIsReady(true);
			// Report Jellyfin server: Playback has begin
			getPlaystateApi(api).reportPlaybackStart({
				playbackStartInfo: {
					AudioStreamIndex: mediaSource.audioTrack,
					CanSeek: true,
					IsMuted: false,
					IsPaused: false,
					ItemId: item?.Id,
					MediaSourceId: mediaSource.id,
					PlayMethod: PlayMethod.DirectPlay,
					PlaySessionId: playsessionId,
					PlaybackStartTimeTicks: startPosition,
					PositionTicks: startPosition,
					RepeatMode: RepeatMode.RepeatNone,
					VolumeLevel: volume,
				},
			});
		}
	};

	const handleProgress = async (event: OnProgressProps) => {
		setProgress(secToTicks(event.playedSeconds));
		if (!api) return null;
		// Report Jellyfin server: Playback progress
		getPlaystateApi(api).reportPlaybackProgress({
			playbackProgressInfo: {
				AudioStreamIndex: mediaSource.audioTrack,
				CanSeek: true,
				IsMuted: muted,
				IsPaused: !playing,
				ItemId: item?.Id,
				MediaSourceId: mediaSource.id,
				PlayMethod: PlayMethod.DirectPlay,
				PlaySessionId: playsessionId,
				PlaybackStartTimeTicks: startPosition,
				PositionTicks: secToTicks(event.playedSeconds),
				RepeatMode: RepeatMode.RepeatNone,
				VolumeLevel: Math.floor(volume * 100),
			},
		});
	};

	const handleExitPlayer = async () => {
		appWindow.getCurrent().setFullscreen(false);

		history.back();
		if (!api) return null;
		// Report Jellyfin server: Playback has ended/stopped
		getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				Failed: false,
				ItemId: item?.Id,
				MediaSourceId: mediaSource.id,
				PlaySessionId: playsessionId,
				PositionTicks: progress,
			},
		});
		usePlaybackStore.setState(usePlaybackStore.getInitialState());
		clearQueue();
	};

	const handleShowOsd = () => {
		let timer = null;
		if (hoveringOsd) {
			return;
		}
		setHoveringOsd(true);
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => setHoveringOsd(false), 5000);
	};

	const handleKeyPress = useCallback((event: KeyboardEvent) => {
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
					setPlaying((state) => !state);
					break;
				case "ArrowUp":
					// setVolume((state) => (state <= 0.9 ? state + 0.1 : state));
					break;
				case "ArrowDown":
					// setVolume((state) => (state >= 0.1 ? state - 0.1 : state));
					break;
				case "F":
				case "f":
					setAppFullscreen((state) => {
						appWindow.getCurrent().setFullscreen(!state);
						return !state;
					});
					break;
				case "P":
				case "p":
					// setIsPIP((state) => !state);
					break;
				case "M":
				case "m":
					// setIsMuted((state) => !state);
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

	const playerOSDRef = useRef<HTMLDivElement>(null);
	// Volume control with mouse wheel
	useEffect(() => {
		const handleMouseWheel = (event: WheelEvent) => {
			if (event.deltaY < 0) {
				// increase volume
				setVolume((state) => Math.min(1, state + VOLUME_SCROLL_INTERVAL));
			} else if (event.deltaY > 0) {
				// decrease volume
				setVolume((state) => Math.max(0, state - VOLUME_SCROLL_INTERVAL));
			}
		};

		// attach the event listener
		playerOSDRef.current?.addEventListener("wheel", handleMouseWheel);

		// remove the event listener
		return () => {
			playerOSDRef.current?.removeEventListener("wheel", handleMouseWheel);
		};
	}, []);

	// Set playing state to true when a new item is loaded
	useLayoutEffect(() => {
		setPlaying(true);
		setIsReady(false);
	}, [item?.Id]);

	useEffect(() => {
		if (player.current?.getInternalPlayer() && mediaSource.subtitle.enable) {
			let jassubRenderer: JASSUB | undefined;
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
				// @ts-ignore internalPlayer here provides the HTML video player element
				const videoElem: HTMLMediaElement =
					player.current.getInternalPlayer() as HTMLMediaElement;
				addSubtitleTrackToReactPlayer(
					player.current.getInternalPlayer() as HTMLMediaElement,
					mediaSource.subtitle,
					api?.basePath ?? "",
				);
			}
			return () => {
				if (jassubRenderer) {
					jassubRenderer.destroy();
				} // Remove JASSUB renderer when track changes to fix duplicate renders
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
	}, [
		mediaSource.subtitle.track,
		mediaSource.subtitle.enable,
		player.current?.getInternalPlayer(),
	]);

	const showSkipIntroButton = useMemo(() => {
		if (
			progress >= (introInfo?.StartTicks ?? 0) &&
			progress < (introInfo?.EndTicks ?? 0)
		) {
			return true;
		}
		return false;
	}, [progress]);

	const showUpNextCard = useMemo(() => {
		if (queue?.[currentQueueItemIndex]?.Id === queue?.[queue.length - 1]?.Id) {
			return false; // Check if the current playing episode is last episode in queue
		}
		if (creditInfo) {
			if (
				progress >= (creditInfo.StartTicks ?? progress + 1) &&
				progress < (creditInfo.EndTicks ?? 0)
			)
				return true;
		}
		if (
			Math.ceil(ticksToSec(itemDuration) - ticksToSec(progress)) <= 30 &&
			Math.ceil(ticksToSec(itemDuration) - ticksToSec(progress)) > 0
		) {
			return true;
		}
		return false;
	}, [progress, item?.Id]);

	const showSkipRecap = useMemo(() => {
		if (
			recapInfo &&
			progress >= (recapInfo?.StartTicks ?? 0) &&
			progress < (recapInfo?.EndTicks ?? 0)
		) {
			return true;
		}
		return false;
	}, [progress, item?.Id]);

	const handleSkipIntro = useCallback(() => {
		player.current?.seekTo(
			ticksToSec(Number(introInfo?.EndTicks)) ??
				player.current?.getCurrentTime(),
		);
	}, [item?.Id]);

	const handleSkipRecap = useCallback(() => {
		player.current?.seekTo(
			ticksToSec(Number(recapInfo?.EndTicks)) ??
				player.current?.getCurrentTime(),
		);
	}, [item?.Id]);

	const [forceShowCredits, setForceShowCredits] = useState(false);
	const handleShowCredits = useCallback(() => {
		setForceShowCredits(true);
	}, []);
	useEffect(() => setForceShowCredits(false), [item?.Id]);

	const chapterMarks = useMemo(() => {
		const marks: { value: number }[] = [];
		item?.Chapters?.map((val) => {
			marks.push({ value: val.StartPositionTicks ?? 0 });
		});
		return marks;
	}, [item?.Chapters]);

	const [showChapterList, setShowChapterList] =
		useState<HTMLButtonElement | null>(null);
	const handleShowChapterList: MouseEventHandler<HTMLButtonElement> =
		useCallback((e) => {
			setShowChapterList(e.currentTarget);
		}, []);

	const sliderDisplayFormat = (value: number) => {
		const currentChapter = item?.Chapters?.filter((chapter, index) => {
			if (index + 1 === item.Chapters?.length) {
				return chapter;
			}
			if (
				(item.Chapters?.[index + 1]?.StartPositionTicks ?? value) - value >=
					0 &&
				(chapter.StartPositionTicks ?? value) - value < 0
			) {
				return chapter;
			}
		});

		let trickplayResolution: TrickplayInfo | undefined;
		const trickplayResolutions = mediaSource.id
			? item?.Trickplay?.[mediaSource.id]
			: null;
		if (trickplayResolutions) {
			let bestWidth: number | undefined;
			const maxWidth = window.screen.width * window.devicePixelRatio * 0.2;
			for (const [_, trickInfo] of Object.entries(trickplayResolutions)) {
				if (
					!bestWidth ||
					(trickInfo.Width &&
						((trickInfo.Width < bestWidth && bestWidth > maxWidth) ||
							(trickInfo.Width > bestWidth && bestWidth <= maxWidth)))
				) {
					bestWidth = trickInfo.Width;
				}
			}
			if (bestWidth) {
				trickplayResolution = trickplayResolutions[bestWidth];
			}
		}
		if (
			trickplayResolution?.TileWidth &&
			trickplayResolution.TileHeight &&
			trickplayResolution.Width &&
			trickplayResolution.Height
		) {
			const currentTrickplayImage = trickplayResolution?.Interval
				? Math.floor(ticksToMs(value) / trickplayResolution?.Interval)
				: 0;
			const trickplayImageSize =
				trickplayResolution?.TileWidth * trickplayResolution?.TileHeight; // this gives the area of a single tile

			const trickplayImageOffset = currentTrickplayImage % trickplayImageSize; // this gives the tile index inside a trickplay image
			const index = Math.floor(currentTrickplayImage / trickplayImageSize); // this gives the index of trickplay image

			const imageOffsetX =
				trickplayImageOffset % trickplayResolution?.TileWidth; // this gives the x coordinate of tile in trickplay image
			const imageOffsetY = Math.floor(
				trickplayImageOffset / trickplayResolution?.TileWidth,
			); // this gives the y coordinate of tile in trickplay image
			const backgroundOffsetX = -(imageOffsetX * trickplayResolution?.Width);
			const backgroundOffsetY = -(imageOffsetY * trickplayResolution?.Height);

			const imgUrlParamsObject: Record<string, string> = {
				api_key: String(api?.accessToken),
				MediaSourceId: mediaSource.id ?? "",
			};
			const imgUrlParams = new URLSearchParams(imgUrlParamsObject).toString();

			const imageAspectRatio =
				trickplayResolution.Width / trickplayResolution.Height;

			if (currentChapter?.[0]?.Name) {
				return (
					<div className="flex flex-column video-osb-bubble">
						<div
							className="video-osd-trickplayBubble"
							style={{
								background: `url(${api?.basePath}/Videos/${item?.Id}/Trickplay/${trickplayResolution.Width}/${index}.jpg?${imgUrlParams})`,
								backgroundPositionX: `${backgroundOffsetX}px`,
								backgroundPositionY: `${backgroundOffsetY}px`,
								width: "100%",
								aspectRatio: imageAspectRatio,
							}}
						/>
						<Typography variant="h6" px="12px" pt={1}>
							{currentChapter?.[0]?.Name}
						</Typography>
						<Typography px="12px" pb={1}>
							{ticksDisplay(value)}
						</Typography>
					</div>
				);
			}
			return (
				<div className="flex flex-column video-osb-bubble">
					<div
						className="video-osd-trickplayBubble"
						style={{
							background: `url(${api?.basePath}/Videos/${item?.Id}/Trickplay/${trickplayResolution.Width}/${index}.jpg?${imgUrlParams})`,
							backgroundPositionX: `${backgroundOffsetX}px`,
							backgroundPositionY: `${backgroundOffsetY}px`,
							width: "100%",
							aspectRatio: imageAspectRatio,
						}}
					/>
					<Typography variant="h6" px="12px" py={1}>
						{ticksDisplay(value)}
					</Typography>
				</div>
			);
		}

		if (currentChapter?.[0]?.Name) {
			return (
				<div className="flex flex-column video-osb-bubble">
					<Typography variant="h6" px="12px" pt={1}>
						{currentChapter?.[0]?.Name}
					</Typography>
					<Typography px={2} pb={1}>
						{ticksDisplay(value)}
					</Typography>
				</div>
			);
		}
		return (
			<div className="flex flex-column video-osb-bubble ">
				<Typography variant="h6" px="12px" py={1}>
					{ticksDisplay(value)}
				</Typography>
			</div>
		);
	};

	const [showVolumeIndicator, setVolumeIndicator] = useState(false);
	useEffect(() => {
		setVolumeIndicator(true);
		const timeout = setTimeout(() => {
			setVolumeIndicator(false);
		}, 1000);
		return () => clearTimeout(timeout);
	}, [volume]);

	const handlePlaybackEnded = () => {
		if (queue?.[currentQueueItemIndex + 1].Id) {
			playItemFromQueue("next", user?.Id, api);
		} else {
			handleExitPlayer(); // Exit player if playback has finished and the queue is empty
		}
	};

	const [subtitleIsChanging, startSubtitleChange] = useTransition();
	const handleSubtitleChange: ChangeEventHandler<
		HTMLInputElement | HTMLTextAreaElement
	> = useCallback(
		(e) => {
			startSubtitleChange(() => {
				if (mediaSource.subtitle.allTracks) {
					changeSubtitleTrack(
						toNumber(e.target.value),
						mediaSource.subtitle.allTracks,
					);
					setSettingsMenu(null);
				}
			});
		},
		[mediaSource.subtitle.allTracks],
	);

	const [audioTackIsChanging, startAudioTrackChange] = useTransition();
	const handleAudioTrackChange: ChangeEventHandler<
		HTMLInputElement | HTMLTextAreaElement
	> = (e) => {
		// setPlaying(false);
		startAudioTrackChange(() => {
			if (api && mediaSource.audio.allTracks) {
				changeAudioTrack(toNumber(e.target.value), api, progress);
				setIsReady(false);
				// setSettingsMenu(null);
			}
		});

		// setPlaying(true);
	};

	const handlePrevChapter = useCallback(() => {
		const chapters = item?.Chapters?.filter((chapter) => {
			if ((chapter.StartPositionTicks ?? 0) <= progress) {
				return true;
			}
		});
		if (!chapters?.length) {
			player.current?.seekTo(0);
		}
		if (chapters?.length === 1) {
			player.current?.seekTo(ticksToSec(chapters[0].StartPositionTicks ?? 0));
		} else if ((chapters?.length ?? 0) > 1) {
			player.current?.seekTo(
				ticksToSec(chapters?.[chapters.length - 2].StartPositionTicks ?? 0),
			);
		}

		// const chapter = item?.Chapters?.[Number(currentChapterIndex) - 1];
		// player.current?.seekTo(ticksToSec(currentChapter?.[0]?.StartPositionTicks ?? 0));
	}, [progress, playsessionId]);
	const handleNextChapter = useCallback(() => {
		const next = item?.Chapters?.filter((chapter) => {
			if ((chapter.StartPositionTicks ?? 0) > progress) {
				return true;
			}
		})[0];
		console.log("Next Chapter", next);
		player.current?.seekTo(ticksToSec(next?.StartPositionTicks ?? 0));
	}, [progress, playsessionId]);

	const positionRef = React.useRef<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});
	const popperRef = React.useRef<Instance>(null);
	const areaRef = React.useRef<HTMLDivElement>(null);

	const [hoverProgress, setHoverProgress] = useState(0);

	const handleSliderHover = (event: React.MouseEvent) => {
		positionRef.current = { x: event.clientX, y: event.clientY };
		const rect = areaRef.current!.getBoundingClientRect();
		const width = rect.width;
		const distX = event.clientX - rect.left;
		const percentageCovered = distX / width;
		setHoverProgress(percentageCovered * itemDuration);
		if (popperRef.current != null) {
			popperRef.current.update();
		}
	};

	return (
		<div className="video-player">
			<AnimatePresence>
				{(loading || audioTackIsChanging) && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{
							opacity: 1,
						}}
						exit={{ opacity: 0 }}
						style={{
							zIndex: 2,
							position: "absolute",
							height: "100vh",
							width: "100vw",
							top: 0,
							left: 0,
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<CircularProgress size={72} thickness={1.4} />
					</motion.div>
				)}
			</AnimatePresence>
			{showSkipIntroButton && (
				<Button
					variant="outlined"
					size="large"
					//@ts-ignore
					color="white"
					style={{
						position: "absolute",
						bottom: "18vh",
						right: "2em",
						zIndex: 10000,
					}}
					onClick={handleSkipIntro}
				>
					Skip Intro
				</Button>
			)}
			{showSkipRecap && (
				<Button
					variant="outlined"
					size="large"
					//@ts-ignore
					color="white"
					style={{
						position: "absolute",
						bottom: "18vh",
						right: "2em",
						zIndex: 10000,
					}}
					onClick={handleSkipRecap}
				>
					Skip Recap
				</Button>
			)}
			{!forceShowCredits && showUpNextCard && (
				<OutroCard handleShowCredits={handleShowCredits} />
			)}
			<AnimatePresence>
				{showVolumeIndicator && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="video-volume-indicator glass"
					>
						<div className="material-symbols-rounded">
							{volume > 0.7 ? "volume_up" : "volume_down"}
						</div>
						<LinearProgress
							style={{ width: "100%" }}
							value={volume * 100}
							variant="determinate"
						/>
					</motion.div>
				)}
			</AnimatePresence>
			<motion.div
				className={
					hoveringOsd || !playing || isSeeking
						? "video-player-osd hovering"
						: "video-player-osd"
				}
				onMouseMove={handleShowOsd}
				ref={playerOSDRef}
				initial={{
					opacity: 0,
				}}
				animate={{
					opacity: hoveringOsd || !playing || isSeeking ? 1 : 0,
				}}
				style={{
					zIndex: 2,
				}}
				onClick={(event) => {
					if (event.currentTarget !== event.target) {
						return;
					}

					if (event.detail === 1) {
						setClickTimeout(
							setTimeout(() => {
								setPlaying((state) => !state);
							}, 200),
						);
					} else if (event.detail === 2) {
						clearTimeout(clickTimeout);
						setAppFullscreen((state) => {
							appWindow.getCurrent().setFullscreen(!state);
							return !state;
						});
					}
				}}
			>
				<div className="video-player-osd-header flex flex-justify-spaced-between flex-align-center">
					<IconButton onClick={handleExitPlayer}>
						<span className="material-symbols-rounded">arrow_back</span>
					</IconButton>
					<IconButton onClick={(e) => setSettingsMenu(e.currentTarget)}>
						<span className="material-symbols-rounded">settings</span>
					</IconButton>
					<Popover
						anchorEl={settingsMenu}
						open={settingsMenuOpen}
						onClose={() => setSettingsMenu(null)}
						slotProps={{
							paper: {
								style: {
									maxHeight: "20em",
									display: "flex",
									flexDirection: "column",
									gap: "1em",
									width: "24em",
									padding: "1em",
									borderRadius: "12px",
								},
								className: "glass",
							},
						}}
						anchorOrigin={{
							vertical: "bottom",
							horizontal: "right",
						}}
						transformOrigin={{
							vertical: "top",
							horizontal: "right",
						}}
					>
						<TextField
							select
							label="Audio"
							variant="outlined"
							value={mediaSource.audio.track}
							onChange={handleAudioTrackChange}
							fullWidth
							disabled={audioTackIsChanging}
						>
							{mediaSource.audio.allTracks?.map((sub) => (
								<MenuItem key={sub.Index} value={sub.Index}>
									{sub.DisplayTitle}
								</MenuItem>
							))}
						</TextField>
						<TextField
							select
							label="Subtitles"
							variant="outlined"
							value={mediaSource.subtitle.track}
							onChange={handleSubtitleChange}
							fullWidth
							disabled={mediaSource.subtitle.track === -2 || subtitleIsChanging}
						>
							<MenuItem key={-1} value={-1}>
								No Subtitle
							</MenuItem>
							{mediaSource.subtitle.allTracks?.map((sub) => (
								<MenuItem key={sub.Index} value={sub.Index}>
									{sub.DisplayTitle}
								</MenuItem>
							))}
						</TextField>
					</Popover>
				</div>
				{(forceShowCredits || !showUpNextCard) && (
					<div className="video-player-osd-info">
						<Typography variant="h4" fontWeight={500} mb={2}>
							{String(itemName)}
							{episodeTitle && (
								<Typography variant="h6" fontWeight={300} mt={1}>
									{String(episodeTitle)}
								</Typography>
							)}
						</Typography>
						<div className="video-player-osd-controls">
							<div className="video-player-osd-controls-progress">
								<Tooltip
									// title={sliderDisplayFormat(
									// 	positionRef.current.x - areaRef.current!.getBoundingClientRect().x,
									// )}
									key={`${positionRef.current}`}
									title={sliderDisplayFormat(hoverProgress)}
									placement="top"
									slotProps={{
										popper: {
											popperRef,
											anchorEl: {
												getBoundingClientRect: () => {
													return new DOMRect(
														positionRef.current.x,
														areaRef.current!.getBoundingClientRect().y,
														0,
														0,
													);
												},
											},
											disablePortal: true,
										},
										tooltip: {
											className: "glass",
											style: {
												width: "34em",
												overflow: "hidden",
												padding: "12px",
												borderRadius: "20px",
											},
										},
									}}
								>
									<Slider
										value={isSeeking ? sliderProgress : progress}
										max={itemDuration}
										step={1}
										onChange={(_, newValue) => {
											setIsSeeking(true);
											Array.isArray(newValue)
												? setSliderProgress(newValue[0])
												: setSliderProgress(newValue);
										}}
										onChangeCommitted={(_, newValue) => {
											setIsSeeking(false);
											Array.isArray(newValue)
												? setProgress(newValue[0])
												: setProgress(newValue);
											if (Array.isArray(newValue)) {
												player.current?.seekTo(
													ticksToSec(newValue[0]),
													"seconds",
												);
											} else {
												console.log("Seeking to", ticksToSec(newValue));
												player.current?.seekTo(ticksToSec(newValue), "seconds");
											}
										}}
										sx={{
											"& .MuiSlider-thumb": {
												width: 14,
												height: 14,
												transition: "0.1s ease-in-out",
												opacity: 0,
												"&.Mui-active": {
													width: 20,
													height: 20,
													opacity: 1,
												},
											},
											"&:hover .MuiSlider-thumb": {
												opacity: 1,
											},
											"& .MuiSlider-rail": {
												opacity: 0.28,
												background: "white",
											},
										}}
										marks={chapterMarks}
										valueLabelDisplay="off"
										ref={areaRef}
										onMouseMove={handleSliderHover}
									/>
								</Tooltip>
								<div className="video-player-osd-controls-progress-text">
									<Typography>
										{ticksDisplay(isSeeking ? sliderProgress : progress)}
									</Typography>
									<Typography>{ticksDisplay(itemDuration)}</Typography>
								</div>
							</div>
							<div className="flex flex-row flex-justify-spaced-between">
								<div className="video-player-osd-controls-buttons">
									<PlayPreviousButton />
									<IconButton
										onClick={() => {
											player.current?.seekTo(
												player.current.getCurrentTime() - 15,
											);
										}}
									>
										<span className="material-symbols-rounded fill">
											fast_rewind
										</span>
									</IconButton>
									<IconButton onClick={handlePrevChapter}>
										<span className="material-symbols-rounded fill">
											first_page
										</span>
									</IconButton>
									<IconButton onClick={() => setPlaying((state) => !state)}>
										<span className="material-symbols-rounded fill">
											{playing ? "pause" : "play_arrow"}
										</span>
									</IconButton>
									<IconButton
										disabled={
											(item?.Chapters?.[item.Chapters?.length - 1]
												?.StartPositionTicks ?? 0) <= progress
										}
										onClick={handleNextChapter}
									>
										<span className="material-symbols-rounded fill">
											last_page
										</span>
									</IconButton>
									<IconButton
										onClick={() =>
											player.current?.seekTo(
												player.current.getCurrentTime() + 15,
											)
										}
									>
										<span className="material-symbols-rounded fill">
											fast_forward
										</span>
									</IconButton>
									<PlayNextButton />
									<Typography variant="subtitle1">
										{isSeeking
											? endsAt(itemDuration - sliderProgress)
											: endsAt(itemDuration - progress)}
									</Typography>
								</div>
								<div className="video-player-osd-controls-buttons">
									<motion.div
										style={{
											width: "13em",
											padding: "0.5em 1.5em",
											paddingLeft: "0.8em",
											gap: "0.4em",
											background: "black",
											borderRadius: "100px",
											display: "grid",
											justifyContent: "center",
											alignItems: "center",
											gridTemplateColumns: "2em 1fr",
											opacity: 0,
										}}
										animate={{
											opacity: showVolumeControl ? 1 : 0,
										}}
										whileHover={{
											opacity: 1,
										}}
										onMouseLeave={() => setShowVolumeControl(false)}
									>
										<Typography textAlign="center">
											{muted ? 0 : Math.round(volume * 100)}
										</Typography>
										<Slider
											step={0.01}
											max={1}
											size="small"
											value={muted ? 0 : volume}
											onChange={(_, newVal) => {
												Array.isArray(newVal)
													? setVolume(newVal[0])
													: setVolume(newVal);
												if (newVal === 0) setMuted(true);
												else setMuted(false);
											}}
										/>
									</motion.div>
									<IconButton
										onClick={() => setMuted((state) => !state)}
										onMouseMoveCapture={() => {
											setShowVolumeControl(true);
										}}
									>
										<span className="material-symbols-rounded">
											{muted
												? "volume_off"
												: volume < 0.4
													? "volume_down"
													: "volume_up"}
										</span>
									</IconButton>
									<QueueButton />
									<IconButton
										disabled={item?.Chapters?.length === 0}
										onClick={handleShowChapterList}
									>
										<span className="material-symbols-rounded">list</span>
									</IconButton>
									<Menu
										open={Boolean(showChapterList)}
										anchorEl={showChapterList}
										onClose={() => setShowChapterList(null)}
										anchorOrigin={{
											vertical: "top",
											horizontal: "center",
										}}
										transformOrigin={{
											vertical: "bottom",
											horizontal: "center",
										}}
									>
										{chapterMarks &&
											item?.Chapters?.map((chapter) => (
												<MenuItem
													key={chapter.Name}
													onClick={() => {
														player.current?.seekTo(
															ticksToSec(chapter.StartPositionTicks ?? 0),
															"seconds",
														);
														setShowChapterList(null); // Close the chapter list menu
													}}
												>
													{chapter.Name}
												</MenuItem>
											))}
									</Menu>
									<IconButton
										disabled={
											mediaSource.subtitle.allTracks?.length === 0 ||
											subtitleIsChanging
										}
										onClick={() => startSubtitleChange(toggleSubtitleTrack)}
									>
										<span className={"material-symbols-rounded"}>
											{mediaSource.subtitle.enable
												? "closed_caption"
												: "closed_caption_disabled"}
										</span>
									</IconButton>
									<IconButton
										onClick={async () => {
											setAppFullscreen((state) => {
												appWindow.getCurrent().setFullscreen(!state);
												return !state;
											});
										}}
									>
										<span className="material-symbols-rounded fill">
											{appFullscreen ? "fullscreen_exit" : "fullscreen"}
										</span>
									</IconButton>
								</div>
							</div>
						</div>
					</div>
				)}
			</motion.div>
			<ReactPlayer
				key={playsessionId}
				playing={playing}
				url={playbackStream}
				ref={player}
				onProgress={handleProgress}
				onError={(error, data, hls, hlsG) => {
					console.error(error.target.error);
					console.error(data);
					console.error(hls);
					console.error(hlsG);
				}}
				onSeek={(e) => {
					console.log("Seeking to in Player", e);
				}}
				onEnded={handlePlaybackEnded}
				width="100vw"
				height="100vh"
				style={{
					position: "fixed",
					zIndex: 1,
				}}
				volume={muted ? 0 : volume}
				onReady={handleReady}
				onBuffer={() => setLoading(true)}
				onBufferEnd={() => setLoading(false)}
				playsinline
				config={{
					file: {
						attributes: {
							crossOrigin: "anonymous",
							preload: "metadata",
						},
						tracks: [],
					},
				}}
			/>
		</div>
	);
}

export default VideoPlayer;
