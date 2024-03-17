import { appWindow } from "@tauri-apps/api/window";
import React from "react";

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

import { usePlaybackStore } from "../../utils/store/playback";

import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getRuntimeMusic, secToTicks, ticksToSec } from "../../utils/date/time";

import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api/media-info-api";
import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";

import "./videoPlayer.module.scss";

import { endsAt } from "../../utils/date/time";

import { useQuery } from "@tanstack/react-query";

import { ItemFields, LocationType, PlayMethod, RepeatMode } from "@jellyfin/sdk/lib/generated-client";
import { AnimatePresence, motion } from "framer-motion";

import useDebounce from "../../utils/hooks/useDebounce";
import { useApi } from "../../utils/store/api";
import { setBackdrop } from "../../utils/store/backdrop";

import { FormControl, TextField } from "@mui/material";
import JASSUB from "jassub";
import workerUrl from "jassub/dist/jassub-worker.js?url";
import wasmUrl from "jassub/dist/jassub-worker.wasm?url";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import subtitleFont from "./Noto-Sans-Indosphere.ttf";

// export const VideoPlayer = () => {
// 	const navigate = useNavigate();
// 	const [api] = useApi((state) => [state.api]);

// 	const [settingsMenuEl, setSettingsMenuEl] = useState(null);
// 	const settingsMenuState = Boolean(settingsMenuEl);

// 	const [speedMenuEl, setSpeedMenuEl] = useState(null);
// 	const [speed, setSpeed] = useState(3);
// 	const speedMenuState = Boolean(speedMenuEl);
// 	const availableSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// 	const [
// 		url,
// 		startPosition,
// 		itemDuration,
// 		itemId,
// 		itemName,
// 		audioStreamIndex,
// 		subtitleStreamIndex,
// 		userId,
// 		seriesId,
// 		setUrl,
// 		setPosition,
// 		setDurationStore,
// 		setItemId,
// 		setItemName,
// 		setAudioStreamIndex,
// 		setVideoStreamIndex,
// 		setSubtitleStreamIndex,
// 		setMediaSourceId,
// 		setUserId,
// 		setSeriesId,
// 		item,
// 	] = usePlaybackStore((state) => [
// 		state.url,
// 		state.startPosition,
// 		state.duration,
// 		state.itemId,
// 		state.itemName,
// 		state.audioStreamIndex,
// 		state.subtitleStreamIndex,
// 		state.userId,
// 		state.seriesId,
// 		state.setUrl,
// 		state.setPosition,
// 		state.setDuration,
// 		state.setItemId,
// 		state.setItemName,
// 		state.setAudioStreamIndex,
// 		state.setVideoStreamIndex,
// 		state.setSubtitleStreamIndex,
// 		state.setMediaSourceId,
// 		state.setUserId,
// 		state.setSeriesId,
// 		state.item,
// 	]);

// 	const mediaInfo = useQuery({
// 		queryKey: ["videoPlayer", itemId, "mediaInfo"],
// 		queryFn: async () => {
// 			const result = await getMediaInfoApi(api).getPlaybackInfo({
// 				itemId: itemId,
// 				userId: userId,
// 			});
// 			return result.data;
// 		},
// 	});

// 	const episodes = useQuery({
// 		queryKey: ["videoPlayer", itemId, "episodes"],
// 		queryFn: async () => {
// 			const result = await getTvShowsApi(api).getEpisodes({
// 				userId: userId,
// 				seriesId: seriesId,
// 				fields: [ItemFields.MediaSources],
// 				excludeLocationTypes: [LocationType.Virtual],
// 			});
// 			return result.data;
// 		},
// 	});

// 	const currentEpisodeIndex = episodes.data?.Items?.findIndex(
// 		(item) => item.Id === itemId,
// 	);

// 	const [currentSubtrack] = useState(subtitleStreamIndex);

// 	const [showControls, setShowControls] = useState(false);

// 	const player = useRef();
// 	const [isSeeking, setIsSeeking] = useState(false);
// 	const [isBuffering, setIsBuffering] = useState(true);
// 	const [isPlaying, setIsPlaying] = useState(true);
// 	const [isMuted, setIsMuted] = useState(false);
// 	const [isReady, setIsReady] = useState(false);
// 	const [isPIP, setIsPIP] = useState(false);
// 	const [volume, setVolume] = useState(0.8);

// 	const [progress, setProgress] = useState(0);
// 	const [currentTime, setCurrentTime] = useState(startPosition);

// 	const onReady = useCallback(async () => {
// 		if (!isReady) {
// 			const timeToStart = ticksToSec(startPosition);
// 			await getPlaystateApi(api).reportPlaybackStart({
// 				playbackStartInfo: {
// 					PlayMethod: mediaInfo.data?.MediaSources[0].SupportsDirectPlay
// 						? "DirectPlay"
// 						: mediaInfo.data?.MediaSources[0].SupportsDirectStream
// 						  ? "DirectStream"
// 						  : "Transcode",
// 					AudioStreamIndex: audioStreamIndex,
// 					SubtitleStreamIndex: subtitleStreamIndex,
// 					userId: userId,
// 					CanSeek: true,
// 					ItemId: itemId,
// 					MediaSourceId: mediaInfo.data?.MediaSources[0].Id,
// 					PlaySessionId: mediaInfo.data?.PlaySessionId,
// 				},
// 			});

// 			player.current.seekTo(timeToStart, "seconds");
// 			setIsReady(true);
// 		}
// 	});

// 	const handleDisplayCurrentTime = () => {
// 		let time = ticksToSec(progress * itemDuration);
// 		const hr = Math.floor(time / 3600);
// 		time -= hr * 3600;
// 		const min = Math.floor(time / 60);
// 		time -= min * 60;
// 		return `${hr.toLocaleString([], {
// 			minimumIntegerDigits: 2,
// 			maximumFractionDigits: 0,
// 		})}:${min.toLocaleString([], {
// 			minimumIntegerDigits: 2,
// 			maximumFractionDigits: 0,
// 		})}:${time.toLocaleString([], {
// 			minimumIntegerDigits: 2,
// 			maximumFractionDigits: 0,
// 		})}`;
// 	};

// 	const handleDisplayTime = (ticks) => {
// 		let time = ticksToSec(ticks);
// 		const hr = Math.floor(time / 3600);
// 		time -= hr * 3600;
// 		const min = Math.floor(time / 60);
// 		time -= min * 60;
// 		return `${hr.toLocaleString([], {
// 			minimumIntegerDigits: 2,
// 			maximumFractionDigits: 0,
// 		})}:${min.toLocaleString([], {
// 			minimumIntegerDigits: 2,
// 			maximumFractionDigits: 0,
// 		})}:${time.toLocaleString([], {
// 			minimumIntegerDigits: 2,
// 			maximumFractionDigits: 0,
// 		})}`;
// 	};

// 	const handlePlayNextEpisode = () => {
// 		// Reset Player time state
// 		setProgress(0);
// 		setCurrentTime(0);
// 		setIsPlaying(true);

// 		setUserId(userId);

// 		// Set all required stream index
// 		setAudioStreamIndex(0);
// 		setVideoStreamIndex(0);
// 		setSubtitleStreamIndex(0);

// 		setMediaSourceId(episodes.data.Items[currentEpisodeIndex + 1].Id);

// 		setUrl(
// 			`${api.basePath}/Videos/${episodes.data.Items[currentEpisodeIndex + 1].Id}/stream.
// 					${
// 						episodes.data.Items[currentEpisodeIndex + 1].MediaSources[0]
// 							.Container
// 					}
// 				?Static=true&mediaSourceId=${
// 					episodes.data.Items[currentEpisodeIndex + 1].Id
// 				}&deviceId=${api.deviceInfo.id}&api_key=${api.accessToken}&Tag=${
// 					episodes.data.Items[currentEpisodeIndex + 1].MediaSources[0].ETag
// 				}&videoStreamIndex=${0}&audioStreamIndex=${0}`,
// 		);
// 		setPosition(
// 			episodes.data.Items[currentEpisodeIndex + 1].UserData
// 				?.PlaybackPositionTicks,
// 		);

// 		setSeriesId(episodes.data.Items[currentEpisodeIndex + 1].SeriesId);
// 		if (episodes.data.Items[currentEpisodeIndex + 1].ImageBlurHashes.Logo) {
// 			setItemName(
// 				<div className="video-osd-name">
// 					<img
// 						alt="Series Logo"
// 						src={`${api.basePath}/Items/${
// 							episodes.data.Items[currentEpisodeIndex + 1].SeriesId
// 						}/Images/Logo`}
// 						className="video-osd-name-logo"
// 						onLoad={(e) => {
// 							e.target.style.opacity = 1;
// 						}}
// 					/>
// 					<Typography variant="subtitle1">
// 						S{episodes.data.Items[currentEpisodeIndex + 1].ParentIndexNumber}
// 						:E
// 						{episodes.data.Items[currentEpisodeIndex + 1].IndexNumber}{" "}
// 						{episodes.data.Items[currentEpisodeIndex + 1].Name}
// 					</Typography>
// 				</div>,
// 			);
// 		} else {
// 			setItemName(
// 				<div className="video-osd-name">
// 					<Typography variant="h6">
// 						{episodes.data.Items[currentEpisodeIndex + 1].SeriesName}
// 					</Typography>
// 					<Typography variant="subtitle1">
// 						S{episodes.data.Items[currentEpisodeIndex + 1].ParentIndexNumber}
// 						:E
// 						{episodes.data.Items[currentEpisodeIndex + 1].IndexNumber}{" "}
// 						{episodes.data.Items[currentEpisodeIndex + 1].Name}
// 					</Typography>
// 				</div>,
// 			);
// 		}

// 		setItemId(episodes.data.Items[currentEpisodeIndex + 1].Id);
// 		setDurationStore(episodes.data.Items[currentEpisodeIndex + 1].RunTimeTicks);
// 	};
// 	const handlePlayPrevEpisode = () => {
// 		// Reset video player state
// 		setProgress(0);
// 		setCurrentTime(0);
// 		setIsPlaying(true);

// 		setUserId(userId);

// 		// Set all required stream index
// 		setAudioStreamIndex(0);
// 		setVideoStreamIndex(0);
// 		setSubtitleStreamIndex(0);

// 		setMediaSourceId(episodes.data.Items[currentEpisodeIndex - 1].Id);

// 		setUrl(
// 			`${api.basePath}/Videos/${episodes.data.Items[currentEpisodeIndex - 1].Id}/stream.
// 					${
// 						episodes.data.Items[currentEpisodeIndex - 1].MediaSources[0]
// 							.Container
// 					}
// 				?Static=true&mediaSourceId=${
// 					episodes.data.Items[currentEpisodeIndex - 1].Id
// 				}&deviceId=${api.deviceInfo.id}&api_key=${api.accessToken}&Tag=${
// 					episodes.data.Items[currentEpisodeIndex - 1].MediaSources[0].ETag
// 				}&videoStreamIndex=${0}&audioStreamIndex=${0}`,
// 		);
// 		setPosition(
// 			episodes.data.Items[currentEpisodeIndex - 1].UserData
// 				?.PlaybackPositionTicks,
// 		);

// 		setSeriesId(episodes.data.Items[currentEpisodeIndex - 1].SeriesId);
// 		if (episodes.data.Items[currentEpisodeIndex - 1].ImageBlurHashes.Logo) {
// 			setItemName(
// 				<div className="video-osd-name">
// 					<img
// 						alt="Series Logo"
// 						src={`${api.basePath}/Items/${
// 							episodes.data.Items[currentEpisodeIndex - 1].SeriesId
// 						}/Images/Logo`}
// 						className="video-osd-name-logo"
// 						onLoad={(e) => {
// 							e.target.style.opacity = 1;
// 						}}
// 					/>
// 					<Typography variant="subtitle1">
// 						S{episodes.data.Items[currentEpisodeIndex - 1].ParentIndexNumber}
// 						:E
// 						{episodes.data.Items[currentEpisodeIndex - 1].IndexNumber}{" "}
// 						{episodes.data.Items[currentEpisodeIndex - 1].Name}
// 					</Typography>
// 				</div>,
// 			);
// 		} else {
// 			setItemName(
// 				<div className="video-osd-name">
// 					<Typography variant="h6">
// 						{episodes.data.Items[currentEpisodeIndex - 1].SeriesName}
// 					</Typography>
// 					<Typography variant="subtitle1">
// 						S{episodes.data.Items[currentEpisodeIndex - 1].ParentIndexNumber}
// 						:E
// 						{episodes.data.Items[currentEpisodeIndex - 1].IndexNumber}{" "}
// 						{episodes.data.Items[currentEpisodeIndex - 1].Name}
// 					</Typography>
// 				</div>,
// 			);
// 		}

// 		setItemId(episodes.data.Items[currentEpisodeIndex - 1].Id);
// 		setDurationStore(episodes.data.Items[currentEpisodeIndex - 1].RunTimeTicks);
// 	};

// 	const [appFullscreen, setAppFullScreen] = useState(false);

// 	// const handleKeyPress = useCallback((event) => {
// 	// 	switch (event.key) {
// 	// 		case "ArrowRight":
// 	// 			player.current.seekTo(player.current.getCurrentTime() + 15);
// 	// 			break;
// 	// 		case "ArrowLeft":
// 	// 			player.current.seekTo(player.current.getCurrentTime() - 15);
// 	// 			break;
// 	// 		case " ":
// 	// 			setIsPlaying((state) => !state);
// 	// 			break;
// 	// 		case "ArrowUp":
// 	// 			setVolume((state) => (state <= 0.9 ? state + 0.1 : state));
// 	// 			break;
// 	// 		case "ArrowDown":
// 	// 			setVolume((state) => (state >= 0.1 ? state - 0.1 : state));
// 	// 			break;
// 	// 		case "F":
// 	// 		case "f":
// 	// 			setAppFullScreen((state) => !state);
// 	// 			break;
// 	// 		case "P":
// 	// 		case "p":
// 	// 			setIsPIP((state) => !state);
// 	// 			break;
// 	// 		case "M":
// 	// 		case "m":
// 	// 			setIsMuted((state) => !state);
// 	// 			break;
// 	// 		default:
// 	// 			console.log(event.key);
// 	// 			break;
// 	// 	}
// 	// }, []);

// 	useEffect(() => {
// 		appWindow.setFullscreen(appFullscreen);
// 	}, [appFullscreen]);

// 	// useEffect(() => {
// 	// 	// attach the event listener
// 	// 	document.addEventListener("keydown", handleKeyPress);

// 	// 	// remove the event listener
// 	// 	return () => {
// 	// 		document.removeEventListener("keydown", handleKeyPress);
// 	// 	};
// 	// }, [handleKeyPress]);

// 	// const [showVolume, setShowVolume] = useState(false);

// 	// // Show/Hide volume Indicator
// 	// useEffect(() => {
// 	// 	setShowVolume(true);
// 	// 	const timeout = setTimeout(() => {
// 	// 		setShowVolume(false);
// 	// 	}, 5000);
// 	// 	return () => {
// 	// 		clearTimeout(timeout);
// 	// 	};
// 	// }, []);

// 	// const handleExit = async () => {
// 	// 	// Remove app from fullscreen
// 	// 	await appWindow.setFullscreen(false);
// 	// 	// Send playback end report
// 	// 	await getPlaystateApi(api).reportPlaybackStopped({
// 	// 		playbackStopInfo: {
// 	// 			Failed: false,
// 	// 			Item: item,
// 	// 			ItemId: itemId,
// 	// 			MediaSourceId: mediaInfo.data?.MediaSources[0].Id,
// 	// 			PlaySessionId: mediaInfo.data?.PlaySessionId,
// 	// 			PositionTicks: currentTime,
// 	// 		},
// 	// 	});

// 	// 	navigate(-1);

// 	// 	// Reset playback store
// 	// 	setUrl("");
// 	// 	setPosition(0);
// 	// 	setDurationStore(0);
// 	// 	setItemId("");
// 	// 	setItemName("");
// 	// 	setAudioStreamIndex(0);
// 	// 	setVideoStreamIndex(0);
// 	// 	setSubtitleStreamIndex(0);
// 	// 	setMediaSourceId("");
// 	// 	setUserId("");
// 	// 	setSeriesId("");
// 	// };

// 	const handleOnEnd = () => {
// 		if (seriesId) {
// 			if (episodes.isSuccess && episodes.data.TotalRecordCount > 0) {
// 				handlePlayNextEpisode();
// 			}
// 		} else {
// 			handleExit();
// 		}
// 	};

// 	const onProgress = async (e) => {
// 		if (!isSeeking) {
// 			setProgress(e.played);
// 			setCurrentTime(secToTicks(e.playedSeconds));
// 		}
// 		await getPlaystateApi(api).reportPlaybackProgress({
// 			playbackProgressInfo: {
// 				PlayMethod: mediaInfo.data?.MediaSources[0].SupportsDirectPlay
// 					? "DirectPlay"
// 					: mediaInfo.data?.MediaSources[0].SupportsDirectStream
// 					  ? "DirectStream"
// 					  : "Transcode",
// 				ItemId: itemId,
// 				IsMuted: isMuted,
// 				PositionTicks: secToTicks(e.playedSeconds),
// 				PlaybackStartTimeTicks: startPosition,
// 				VolumeLevel: volume * 100,
// 				IsPaused: !isPlaying,
// 				AudioStreamIndex: audioStreamIndex,
// 				Brightness: 100,
// 				CanSeek: true,
// 				MediaSourceId: mediaInfo.data?.MediaSources[0].Id,
// 				SubtitleStreamIndex: subtitleStreamIndex,
// 				PlaySessionId: mediaInfo.data?.PlaySessionId,
// 			},
// 		});
// 		if (Math.round(e.playedSeconds) === ticksToSec(itemDuration)) {
// 			handleOnEnd();
// 		}
// 	};

// 	if (!itemId) {
// 		return (
// 			<>
// 				<Navigate to="/library/index" />;
// 			</>
// 		);
// 	}

// 	return (
// 		<div
// 			className="video-player-container"
// 			style={{ background: "black" }}
// 			onMouseMove={() => {
// 				setShowControls(true);
// 			}}
// 			key={itemId}
// 		>
// 			<AnimatePresence>
// 				{showVolume && (
// 					<motion.div
// 						initial={{ opacity: 0 }}
// 						animate={{ opacity: 1 }}
// 						exit={{ opacity: 0 }}
// 						style={{
// 							position: "absolute",
// 							top: "4em",
// 							right: "4em",
// 							background: "rgb(0 0 0/ 0.5)",
// 							backdropFilter: "blur(10px)",
// 							width: "10em",
// 							height: "10em",
// 							padding: "1em",
// 							display: "flex",
// 							alignItems: "center",
// 							justifyContent: "center",
// 							flexDirection: "column",
// 							borderRadius: "10px",
// 							border: "2px solid rgb(255 255 255 / 0.2)",
// 							gap: "2em",
// 						}}
// 					>
// 						<div
// 							className="material-symbols-rounded"
// 							style={{ fontSize: "2.8em" }}
// 						>
// 							{isMuted ? "volume_mute" : "volume_up"}
// 						</div>
// 						<LinearProgress
// 							variant="determinate"
// 							value={volume * 100}
// 							style={{
// 								width: "8em",
// 								margin: "0 1em",
// 							}}
// 						/>
// 					</motion.div>
// 				)}
// 			</AnimatePresence>
// 			<div
// 				style={{
// 					position: "absolute",
// 					inset: 0,
// 					display: "flex",
// 					alignItems: "center",
// 					justifyContent: "center",
// 					opacity: isBuffering ? 1 : 0,
// 					transition: "opacity 250ms",
// 				}}
// 			>
// 				<CircularProgress />
// 			</div>
// 			<Backdrop
// 				className={showControls ? "video-osd video-osd-visible" : "video-osd"}
// 				sx={{
// 					display: "flex",
// 					flexDirection: "column",
// 					zIndex: 1000,
// 					justifyContent: "space-between",
// 					background: "transparent",
// 				}}
// 				open={showControls}
// 			>
// 				<div
// 					style={{
// 						background:
// 							"linear-gradient(to bottom, rgb(0 0 0 / 0.75), transparent)",
// 						width: "100vw",
// 						display: "flex",
// 						alignItems: "center",
// 						padding: "0.85em 1.2em",
// 					}}
// 				>
// 					<IconButton onClick={handleExit}>
// 						<span className="material-symbols-rounded">arrow_back</span>
// 					</IconButton>

// 					{itemName}
// 				</div>
// 				<Stack
// 					direction="column"
// 					padding={2}
// 					width="100%"
// 					sx={{
// 						background:
// 							"linear-gradient(to top, rgb(0 0 0 / 0.75), transparent)",
// 					}}
// 				>
// 					<Stack
// 						width="100%"
// 						direction="row"
// 						alignItems="center"
// 						justifyContent="center"
// 						gap={2}
// 					>
// 						<Typography variant="h6">{handleDisplayCurrentTime()}</Typography>
// 						<Slider
// 							value={currentTime ? currentTime : 0}
// 							step={0.01}
// 							max={itemDuration}
// 							onChange={(e, newVal) => {
// 								setIsSeeking(true);
// 								setCurrentTime(newVal);
// 							}}
// 							onChangeCommitted={(e, newVal) => {
// 								player.current.seekTo(ticksToSec(newVal));
// 								setCurrentTime(newVal);
// 								setIsSeeking(false);
// 							}}
// 							valueLabelDisplay="auto"
// 							valueLabelFormat={(value) => handleDisplayTime(value)}
// 							// size="medium"
// 							sx={{
// 								"& .MuiSlider-valueLabel": {
// 									lineHeight: 1.2,
// 									fontSize: 24,
// 									background: "rgb(0 0 0 / 0.5)",
// 									backdropFilter: "blur(5px)",
// 									padding: 1,
// 									borderRadius: "10px",
// 									border: "1px solid rgb(255 255 255 / 0.15)",
// 									boxShadow: "0 0 10px rgb(0 0 0 / 0.4) ",
// 									transform: "translatey(-120%) scale(0)",
// 									"&:before": { display: "none" },
// 									"&.MuiSlider-valueLabelOpen": {
// 										transform: "translateY(-120%) scale(1)",
// 									},
// 									"& > *": {
// 										transform: "rotate(0deg)",
// 									},
// 								},
// 							}}
// 						/>
// 						<Typography variant="h6">
// 							{handleDisplayTime(itemDuration)}
// 						</Typography>
// 					</Stack>
// 					<Stack
// 						direction="row"
// 						justifyContent="space-between"
// 						alignItems="center"
// 					>
// 						<Stack
// 							direction="row"
// 							gap={1}
// 							justifyContent="center"
// 							alignItems="center"
// 						>
// 							<IconButton
// 								onClick={handlePlayPrevEpisode}
// 								disabled={
// 									seriesId
// 										? episodes.isPending || currentEpisodeIndex === 0
// 										: true
// 								}
// 							>
// 								<div className="material-symbols-rounded">skip_previous</div>
// 							</IconButton>
// 							<IconButton
// 								onClick={() =>
// 									player.current.seekTo(
// 										player.current.getCurrentTime() - 15,
// 									)
// 								}
// 							>
// 								<div className="material-symbols-rounded">fast_rewind</div>
// 							</IconButton>
// 							<IconButton onClick={() => setIsPlaying((state) => !state)}>
// 								<div className="material-symbols-rounded">
// 									{isPlaying ? "pause" : "play_arrow"}
// 								</div>
// 							</IconButton>
// 							<IconButton
// 								onClick={() =>
// 									player.current.seekTo(
// 										player.current.getCurrentTime() + 15,
// 									)
// 								}
// 							>
// 								<div className="material-symbols-rounded">fast_forward</div>
// 							</IconButton>
// 							<IconButton
// 								onClick={handlePlayNextEpisode}
// 								disabled={
// 									seriesId
// 										? episodes.isPending ||
// 										  episodes.data?.TotalRecordCount ===
// 												currentEpisodeIndex + 1
// 										: true
// 								}
// 							>
// 								<div className="material-symbols-rounded">skip_next</div>
// 							</IconButton>
// 							<Typography variant="subtitle1">
// 								{endsAt(itemDuration - currentTime)}
// 							</Typography>
// 						</Stack>
// 						<Stack
// 							direction="row"
// 							gap={1}
// 							alignItems="center"
// 							justifyContent="center"
// 						>
// 							<Box>
// 								<Menu
// 									anchorEl={speedMenuEl}
// 									open={speedMenuState}
// 									onClose={() => setSpeedMenuEl(null)}
// 									MenuListProps={{
// 										"aria-labelledby": "lock-button",
// 										role: "listbox",
// 									}}
// 									anchorOrigin={{
// 										vertical: "top",
// 										horizontal: "center",
// 									}}
// 									transformOrigin={{
// 										vertical: "bottom",
// 										horizontal: "center",
// 									}}
// 									sx={{
// 										mb: 20,
// 									}}
// 								>
// 									{availableSpeeds.map((sspeed, index) => {
// 										return (
// 											<MenuItem
// 												key={sspeed}
// 												selected={index === speed}
// 												onClick={() => {
// 													setSpeed(index);
// 													setSpeedMenuEl(null);
// 												}}
// 												sx={{
// 													width: 160,
// 												}}
// 											>
// 												{sspeed}x
// 											</MenuItem>
// 										);
// 									})}
// 								</Menu>
// 								<IconButton onClick={(e) => setSpeedMenuEl(e.currentTarget)}>
// 									<div className="material-symbols-rounded">pace</div>
// 								</IconButton>
// 							</Box>
// 							<IconButton
// 								sx={{
// 									ml: 0.1,
// 								}}
// 								onClick={() => setIsMuted((state) => !state)}
// 							>
// 								<div className="material-symbols-rounded">
// 									{isMuted ? "volume_mute" : "volume_up"}
// 								</div>
// 							</IconButton>
// 							<Slider
// 								value={isMuted ? 0 : volume * 100}
// 								step={1}
// 								max={100}
// 								onChange={(e, newVal) => setVolume(newVal / 100)}
// 								valueLabelDisplay="auto"
// 								valueLabelFormat={(value) => Math.floor(value)}
// 								size="small"
// 								sx={{
// 									mr: 1,
// 									ml: 1,
// 									width: "8em",
// 									"& .MuiSlider-valueLabel": {
// 										lineHeight: 1.2,
// 										fontSize: 24,
// 										background: "rgb(0 0 0 / 0.5)",
// 										backdropFilter: "blur(5px)",
// 										padding: 1,
// 										borderRadius: "10px",
// 										border: "1px solid rgb(255 255 255 / 0.15)",
// 										boxShadow: "0 0 10px rgb(0 0 0 / 0.4) ",
// 										transform: "translatey(-120%) scale(0)",
// 										"&:before": {
// 											display: "none",
// 										},
// 										"&.MuiSlider-valueLabelOpen": {
// 											transform: "translateY(-120%) scale(1)",
// 										},
// 										"& > *": {
// 											transform: "rotate(0deg)",
// 										},
// 									},
// 								}}
// 							/>
// 							<Box>
// 								<Menu
// 									anchorEl={settingsMenuEl}
// 									onClose={() => {
// 										setSettingsMenuEl(null);
// 									}}
// 									open={settingsMenuState}
// 									sx={{ padding: 2 }}
// 								>
// 									<Stack direction="row">
// 										<Typography variant="h6">Subtitle</Typography>
// 									</Stack>
// 								</Menu>
// 								<IconButton
// 									onClick={(e) => setSettingsMenuEl(e.currentTarget)}
// 									disabled
// 								>
// 									<div className="material-symbols-rounded">settings</div>
// 								</IconButton>
// 							</Box>
// 							<IconButton
// 								onClick={() => {
// 									setIsPIP(!isPIP);
// 								}}
// 							>
// 								<div className="material-symbols-rounded">
// 									picture_in_picture_alt
// 								</div>
// 							</IconButton>
// 							<IconButton
// 								onClick={async () => {
// 									const fstate = await appWindow.isFullscreen();
// 									setAppFullScreen(!fstate);
// 								}}
// 							>
// 								<div className="material-symbols-rounded">
// 									{appFullscreen ? "fullscreen_exit" : "fullscreen"}
// 								</div>
// 							</IconButton>
// 						</Stack>
// 					</Stack>
// 				</Stack>
// 			</Backdrop>
// 			<ReactPlayer
// 				ref={player}
// 				width="100vw"
// 				height="100vh"
// 				playing={isPlaying}
// 				url={url}
// 				onProgress={onProgress}
// 				onReady={onReady}
// 				muted={isMuted}
// 				pip={isPIP}
// 				volume={volume}
// 				onBuffer={() => setIsBuffering(true)}
// 				onBufferEnd={() => setIsBuffering(false)}
// 				config={{
// 					file: {
// 						attributes: {
// 							crossOrigin: "true",
// 						},
// 						tracks: [
// 							{
// 								kind: "subtitles",
// 								src: `${api.basePath}/Videos/${itemId}/${itemId}/Subtitles/${currentSubtrack}/Stream.vtt?api_key=${api.accessToken}`,
// 								srcLang: "",
// 								default: true,
// 								mode: "showing",
// 							},
// 						],
// 					},
// 				}}
// 				playbackRate={availableSpeeds[speed]}
// 			/>
// 		</div>
// 	);
// };

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

const VideoPlayer = () => {
	const navigate = useNavigate();
	const [api] = useApi((state) => [state.api]);

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
	] = usePlaybackStore((state) => [
		state.hlsStream,
		state.item,
		state.itemName,
		state.itemDuration,
		state.startPosition,
		state.episodeTitle,
		state.mediaSource,
		state.enableSubtitle,
	]);

	const user = useQuery({
		queryKey: ['user'],
		queryFn: async () => {
			const result = await getUserApi(api).getCurrentUser();
			return result.data;
		}
	})

	const mediaInfo = useQuery({
		queryKey: ['videoPlayer', 'mediaInfo'],
		queryFn: async () =>  {
			const result = await getMediaInfoApi(api).getPlaybackInfo({
			itemId: item?.Id,
			userId: user.data?.Id
			}); 
			return result.data
		},
		enabled: user.isSuccess
	})

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
	const [muted, setMuted]= useState(false)

	useEffect(() => setBackdrop("", ""), []);

	const [subtitleRenderer, setSubtitleRenderer] = useState<JASSUB>(null);
	
	const handleReady = async () => {
		if (!isReady) {
			const jet = await fetch(subtitleFont).then(r => r.arrayBuffer());
			const uint8 = new Uint8Array(jet);
			console.log(uint8)
			const subtitleRendererRaw = new JASSUB({
				video: player.current.getInternalPlayer(),
				subUrl: `${api.basePath}/Videos/${item.Id}/${item.Id}/Subtitles/${mediaSource.subtitleTrack}/Stream.ass?api_key=${api.accessToken}`,
				workerUrl,
				wasmUrl,
				availableFonts: { "noto sans": uint8 },
				fallbackFont: "Noto Sans",
			});
			setSubtitleRenderer(subtitleRendererRaw);

			player.current.seekTo(ticksToSec(startPosition), "seconds");
			setIsReady(true);

			// Report Jellyfin server: Playback has begin 
			await getPlaystateApi(api).reportPlaybackStart({
				playbackStartInfo: {
					AudioStreamIndex: mediaSource.audioTrack,
					CanSeek: true,
					IsMuted: false,
					IsPaused: false,
					Item: item,
					ItemId: item?.Id,
					MediaSourceId: mediaSource.id,
					PlayMethod: PlayMethod.DirectPlay,
					PlaySessionId: mediaInfo.data?.PlaySessionId,
					PlaybackStartTimeTicks: startPosition,
					PositionTicks: startPosition,
					RepeatMode: RepeatMode.RepeatNone,
					VolumeLevel: volume,
				}
			})


		}
	};
``
	const handleProgress = async (event) => {
		setProgress(secToTicks(event.playedSeconds));

		// Report Jellyfin server: Playback progress  
		await getPlaystateApi(api).reportPlaybackProgress({
			playbackProgressInfo: {
				AudioStreamIndex: mediaSource.audioTrack,
				CanSeek: true,
				IsMuted: muted,
				IsPaused: !playing,
				ItemId: item?.Id,
				MediaSourceId: mediaSource.id,
				PlayMethod: PlayMethod.DirectPlay,
				PlaySessionId: mediaInfo.data?.PlaySessionId,
				PlaybackStartTimeTicks: startPosition,
				PositionTicks: progress,
				RepeatMode: RepeatMode.RepeatNone,
				VolumeLevel: volume * 100,
			}
		})
	};

	const handleExitPlayer = async () => {
		appWindow.setFullscreen(false);
		subtitleRenderer.destroy();
		navigate(-1);
		// Report Jellyfin server: Playback has ended/stopped 
		await getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				Failed: false,
				Item: item,
				ItemId: item?.Id,
				MediaSourceId: mediaSource.id,
				PlayMethod: PlayMethod.DirectPlay,
				PlaySessionId: mediaInfo.data?.PlaySessionId,
				PlaybackStartTimeTicks: startPosition,
				PositionTicks: progress,
			}
		})
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
					appWindow.setFullscreen(!state)
					return !state
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
		if (subtitleRenderer)
			if (showSubtitles) {
				subtitleRenderer.setTrackByUrl(
					`${api.basePath}/Videos/${item.Id}/${item.Id}/Subtitles/${selectedSubtitle}/Stream.ass?api_key=${api.accessToken}`,
				);
			} else {
				subtitleRenderer.freeTrack();
			}
	}, [showSubtitles, selectedSubtitle]);

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
							position: "relative",
							height: "100vh",
							width: "100vw",
						}}
					>
						<CircularProgress
							size={72}
							thickness={1.4}
							style={{
								position: "absolute",
								top: "50%",
								left: "50%",
								transform: "translate(-50%,-50%)",
							}}
						/>
					</motion.div>
				)}
			</AnimatePresence>
			<motion.div
				className="video-player-osd"
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
							},
						}}
					>
						<TextField
							select
							label="Subtitles"
							variant="outlined"
							value={selectedSubtitle}
							onChange={(e) => setSelectedSubtitle(e.target.value)}
						>
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
								<IconButton disabled>
									<span className="material-symbols-rounded fill">
										skip_previous
									</span>
								</IconButton>
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
								<IconButton disabled>
									<span className="material-symbols-rounded fill">
										skip_next
									</span>
								</IconButton>
								<Typography variant="subtitle1">
									{isSeeking
										? endsAt(itemDuration - sliderProgress)
										: endsAt(itemDuration - progress)}
								</Typography>
							</div>
							<div className="video-player-osd-controls-buttons">
								<motion.div style={{
									width: "13em",
									padding: "0.5em 1.5em",
									paddingLeft: "0.8em",
									gap:"0.4em",
									background: "black",
									borderRadius: "100px",
									display: 'grid',
									justifyContent: "center",
									alignItems: "center",
									gridTemplateColumns: "2em 1fr",
									opacity:0,
								}}
									animate={{
										opacity: showVolumeControl ? 1:0
									}}
									whileHover={{
										opacity:1
									}}
									onMouseLeave={()=> setShowVolumeControl(false)}
								>
									<Typography textAlign="center">{muted ? 0 : Math.round(volume*100)}</Typography>
									<Slider step={0.01} max={1} size="small" value={muted ? 0 : volume} onChange={(e, newVal) => {
										setVolume(newVal);
										if (newVal === 0) setMuted(true) 
										else setMuted(false)
									}} />
								</motion.div>
								<IconButton onClick={() => setMuted((state) => !state)} onMouseMoveCapture={() => {
									setShowVolumeControl(true)
								}}>
									<span className="material-symbols-rounded">{muted ? "volume_off" :
										volume < 0.4 ? "volume_down" :
										"volume_up"}</span>
								</IconButton>
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
					console.log(error.target.error);
					console.log(data);
					console.log(hls);
					console.log(hlsG);
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
};

export default VideoPlayer;
