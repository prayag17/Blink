import { appWindow } from "@tauri-apps/api/window";
import React, { useLayoutEffect } from "react";

import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ReactPlayer from "react-player";

import { usePlaybackStore } from "@/utils/store/playback";

import { getRuntimeMusic, secToTicks, ticksToSec } from "@/utils/date/time";
import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api/media-info-api";
import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";

import "./videoPlayer.scss";

import { endsAt } from "@/utils/date/time";

import { useQuery } from "@tanstack/react-query";

import {
	ItemFields,
	LocationType,
	PlayMethod,
	RepeatMode,
} from "@jellyfin/sdk/lib/generated-client";
import { AnimatePresence, motion } from "framer-motion";

import { setBackdrop } from "@/utils/store/backdrop";

import { FormControl, TextField } from "@mui/material";
import type JASSUB from "jassub";
import workerUrl from "jassub/dist/jassub-worker.js?url";
import wasmUrl from "jassub/dist/jassub-worker.wasm?url";

import PlayNextButton from "@/components/buttons/playNextButton";
import PlayPreviousButton from "@/components/buttons/playPreviousButtom";
import QueueButton from "@/components/buttons/queueButton";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import subtitleFont from "./Noto-Sans-Indosphere.ttf";

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

export const Route = createFileRoute("/_api/player/")({
	component: VideoPlayer,
});

function VideoPlayer() {
	const api = Route.useRouteContext().api;
	const { history } = useRouter();
	const [hoveringOsd, setHoveringOsd] = useState(false);

	const [
		hlsStream,
		item,
		itemName,
		itemDuration,
		startPosition,
		episodeTitle,
		mediaSource,
		enableSubtitle,
		playsessionId,
	] = usePlaybackStore((state) => [
		state.hlsStream,
		state.item,
		state.itemName,
		state.itemDuration,
		state.startPosition,
		state.episodeTitle,
		state.mediaSource,
		state.enableSubtitle,
		state.playsessionId,
	]);

	const [loading, setLoading] = useState(true);
	const [settingsMenu, setSettingsMenu] = useState(null);
	const settingsMenuOpen = Boolean(settingsMenu);
	const [showVolumeControl, setShowVolumeControl] = useState(false);

	// Control States
	const [isReady, setIsReady] = useState(false);
	const [playing, setPlaying] = useState(true);
	const [isSeeking, setIsSeeking] = useState(false);
	const [sliderProgress, setSliderProgress] = useState(startPosition);
	const [progress, setProgress] = useState(startPosition);
	const [appFullscreen, setAppFullscreen] = useState(false);
	const [showSubtitles, setShowSubtitles] = useState(enableSubtitle);
	const [selectedSubtitle, setSelectedSubtitle] = useState(
		mediaSource.subtitleTrack,
	);
	const [volume, setVolume] = useState(1);
	const [muted, setMuted] = useState(false);

	useEffect(() => setBackdrop("", ""), []);

	const [subtitleRenderer, setSubtitleRenderer] = useState<JASSUB>(null);

	const handleReady = async () => {
		if (!isReady) {
			if (selectedSubtitle !== "nosub") {
				const font = await fetch(subtitleFont).then((r) => r.arrayBuffer());
				const uint8 = new Uint8Array(font);
				// const subtitleRendererRaw = new JASSUB({
				// 	video: player.current.getInternalPlayer(),
				// 	subUrl: `${api.basePath}/Videos/${item.Id}/${item.Id}/Subtitles/${mediaSource.subtitleTrack}/Stream.ass?api_key=${api.accessToken}`,
				// 	workerUrl,
				// 	wasmUrl,
				// 	availableFonts: { "noto sans": uint8 },
				// 	fallbackFont: "Noto Sans",
				// });
				// setSubtitleRenderer(subtitleRendererRaw);
			}

			player.current?.seekTo(ticksToSec(startPosition), "seconds");
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

	const handleProgress = async (event) => {
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
				PositionTicks: progress,
				RepeatMode: RepeatMode.RepeatNone,
				VolumeLevel: volume * 100,
			},
		});
	};

	const handleExitPlayer = async () => {
		appWindow.setFullscreen(false);
		if (subtitleRenderer) {
			subtitleRenderer.destroy();
		}
		history.back();
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
	};

	const player = useRef(null);

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

	const handleKeyPress = useCallback((event) => {
		switch (event.key) {
			case "ArrowRight":
				player.current.seekTo(player.current.getCurrentTime() + 10);
				break;
			case "ArrowLeft":
				player.current.seekTo(player.current.getCurrentTime() - 10);
				break;
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
					appWindow.setFullscreen(!state);
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
			default:
				console.log(event.key);
				break;
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

	useEffect(() => {
		async function fetchFonts() {
			const font = await fetch(subtitleFont).then((r) => r.arrayBuffer());
			const uint8 = new Uint8Array(font);
			return uint8;
		}
		if (subtitleRenderer)
			if (showSubtitles) {
				subtitleRenderer.setTrackByUrl(
					`${api.basePath}/Videos/${item?.Id}/${item?.Id}/Subtitles/${selectedSubtitle}/Stream.ass?api_key=${api.accessToken}`,
				);
			} else {
				subtitleRenderer.freeTrack();
			}
		else if (
			!subtitleRenderer &&
			selectedSubtitle !== "nosub" &&
			showSubtitles
		) {
			// fetchFonts().then((uint8) => {
			// 	const subtitleRendererRaw = new JASSUB({
			// 		video: player.current.getInternalPlayer(),
			// 		subUrl: `${api.basePath}/Videos/${item?.Id}/${item?.Id}/Subtitles/${selectedSubtitle}/Stream.ass?api_key=${api.accessToken}`,
			// 		workerUrl,
			// 		wasmUrl,
			// 		availableFonts: { "noto sans": uint8 },
			// 		fallbackFont: "Noto Sans",
			// 	});
			// 	setSubtitleRenderer(subtitleRendererRaw);
			// });
		}
	}, [showSubtitles, selectedSubtitle]);

	useLayoutEffect(() => {
		setPlaying(true);
		setIsReady(false);
	}, [item?.Id]);

	return (
		<div className="video-player">
			<AnimatePresence>
				{loading && (
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
			<motion.div
				className={
					hoveringOsd || !playing || isSeeking
						? "video-player-osd hovering"
						: "video-player-osd"
				}
				onMouseMove={handleShowOsd}
				initial={{
					opacity: 0,
				}}
				animate={{
					opacity: hoveringOsd || !playing || isSeeking ? 1 : 0,
				}}
				style={{
					zIndex: 2,
				}}
			>
				<div className="video-player-osd-header flex flex-justify-spaced-between flex-align-center">
					<IconButton onClick={handleExitPlayer}>
						<span className="material-symbols-rounded">arrow_back</span>
					</IconButton>
					<IconButton
						onClick={(e: MouseEvent) => setSettingsMenu(e.currentTarget)}
					>
						<span className="material-symbols-rounded">settings</span>
					</IconButton>
					<Menu
						anchorEl={settingsMenu}
						open={settingsMenuOpen}
						onClose={() => setSettingsMenu(null)}
						slotProps={{
							paper: {
								style: {
									maxHeight: "20em",
								},
							},
						}}
						MenuListProps={{
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "1em",
								width: "24em",
							},
						}}
						style={{}}
					>
						<TextField
							select
							label="Subtitles"
							variant="outlined"
							value={selectedSubtitle}
							onChange={(e) => setSelectedSubtitle(e.target.value)}
							fullWidth
						>
							<MenuItem key={-1} value={"nosub"}>
								No Subtitle
							</MenuItem>
							{mediaSource.availableSubtitleTracks.map((sub) => (
								<MenuItem key={sub.Index} value={sub.Index}>
									{sub.DisplayTitle}
								</MenuItem>
							))}
						</TextField>
					</Menu>
				</div>
				<div className="video-player-osd-info">
					<Typography variant="h4" fontWeight={500} mb={2}>
						{itemName}
						{episodeTitle && (
							<Typography variant="h6" fontWeight={300} mt={1}>
								{episodeTitle}
							</Typography>
						)}
					</Typography>
					<div className="video-player-osd-controls">
						<div className="video-player-osd-controls-progress">
							<Slider
								value={isSeeking ? sliderProgress : progress}
								max={itemDuration}
								step={secToTicks(1)}
								onChange={(e, newValue) => {
									setIsSeeking(true);
									setSliderProgress(newValue);
								}}
								onChangeCommitted={(e, newValue) => {
									setIsSeeking(false);
									setProgress(newValue);
									player.current.seekTo(ticksToSec(newValue), "seconds");
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
							/>
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
									onClick={() =>
										player.current.seekTo(player.current.getCurrentTime() - 15)
									}
								>
									<span className="material-symbols-rounded fill">
										fast_rewind
									</span>
								</IconButton>
								<IconButton onClick={() => setPlaying((state) => !state)}>
									<span className="material-symbols-rounded fill">
										{playing ? "pause" : "play_arrow"}
									</span>
								</IconButton>
								<IconButton
									onClick={() =>
										player.current.seekTo(player.current.getCurrentTime() + 15)
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
										onChange={(e, newVal) => {
											setVolume(newVal);
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
								<IconButton onClick={() => setShowSubtitles((state) => !state)}>
									<span className={"material-symbols-rounded"}>
										{showSubtitles
											? "closed_caption"
											: "closed_caption_disabled"}
									</span>
								</IconButton>
								<IconButton
									onClick={async () => {
										setAppFullscreen((state) => {
											appWindow.setFullscreen(!state);
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
			</motion.div>
			{/* <video src={hlsStream}></video> */}
			<ReactPlayer
				key={item?.Id}
				playing={playing}
				url={hlsStream}
				ref={player}
				onProgress={handleProgress}
				onError={(error, data, hls, hlsG) => {
					console.error(error.target.error);
					console.error(data);
					console.error(hls);
					console.error(hlsG);
				}}
				width="100vw"
				height="100vh"
				style={{
					position: "fixed",
					zIndex: 1,
				}}
				// onReady={(playerRef) => {
				// 	playerRef.seekTo(ticksToSec(startPosition));
				// }}
				volume={muted ? 0 : volume}
				onReady={handleReady}
				onBuffer={() => setLoading(true)}
				onBufferEnd={() => setLoading(false)}
			/>
		</div>
	);
}

export default VideoPlayer;
