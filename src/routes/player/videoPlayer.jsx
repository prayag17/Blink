/** @format */
import React from "react";
import { appWindow } from "@tauri-apps/api/window";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import CircularProgress from "@mui/material/CircularProgress";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Backdrop from "@mui/material/Backdrop";
import LinearProgress from "@mui/material/LinearProgress";

import ReactPlayer from "react-player";

import { usePlaybackStore } from "../../utils/store/playback";
import { MdiArrowLeft } from "../../components/icons/mdiArrowLeft";
import { MdiPlay } from "../../components/icons/mdiPlay";

import { useNavigate } from "react-router-dom";
import { useRef, useState, useCallback, useEffect } from "react";
import { secToTicks, ticksToSec } from "../../utils/date/time";

import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api/media-info-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";

import "./videoPlayer.module.scss";
import { MdiPause } from "../../components/icons/mdiPause";
import { MdiFastForward } from "../../components/icons/mdiFastForward";
import { MdiRewind } from "../../components/icons/mdiRewind";
import { MdiFullscreen } from "../../components/icons/mdiFullscreen";
import { MdiFullscreenExit } from "../../components/icons/mdiFullscreenExit";
import { MdiPictureInPictureBottomRight } from "../../components/icons/mdiPictureInPictureBottomRight";
import { MdiVolumeHigh } from "../../components/icons/mdiVolumeHigh";
import { MdiVolumeOff } from "../../components/icons/mdiVolumeOff";
import { MdiPlaySpeed } from "../../components/icons/mdiPlaySpeed";

import { endsAt } from "../../utils/date/time";

import { MdiCog } from "../../components/icons/mdiCog";
import { MdiSkipNext } from "../../components/icons/mdiSkipNext";
import { useQuery } from "@tanstack/react-query";

import { motion, AnimatePresence } from "framer-motion";
import { ItemFields, LocationType } from "@jellyfin/sdk/lib/generated-client";
import { MdiSkipPrevious } from "../../components/icons/mdiSkipPrevious";

import { useApi } from "../../utils/store/api";

export const VideoPlayer = () => {
	const navigate = useNavigate();
	const [api] = useApi((state) => [state.api]);

	const [settingsMenuEl, setSettingsMenuEl] = useState(null);
	const settingsMenuState = Boolean(settingsMenuEl);

	const [speedMenuEl, setSpeedMenuEl] = useState(null);
	const [speed, setSpeed] = useState(3);
	const speedMenuState = Boolean(speedMenuEl);
	const availableSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

	const [
		url,
		startPosition,
		itemDuration,
		itemId,
		itemName,
		audioStreamIndex,
		subtitleStreamIndex,
		userId,
		seriesId,
		setUrl,
		setPosition,
		setDurationStore,
		setItemId,
		setItemName,
		setAudioStreamIndex,
		setVideoStreamIndex,
		setSubtitleStreamIndex,
		setMediaSourceId,
		setUserId,
		setSeriesId,
	] = usePlaybackStore((state) => [
		state.url,
		state.startPosition,
		state.duration,
		state.itemId,
		state.itemName,
		state.audioStreamIndex,
		state.subtitleStreamIndex,
		state.userId,
		state.seriesId,
		state.setUrl,
		state.setPosition,
		state.setDuration,
		state.setItemId,
		state.setItemName,
		state.setAudioStreamIndex,
		state.setVideoStreamIndex,
		state.setSubtitleStreamIndex,
		state.setMediaSourceId,
		state.setUserId,
		state.setSeriesId,
	]);

	const mediaInfo = useQuery({
		queryKey: ["videoPlayer", itemId, "mediaInfo"],
		queryFn: async () => {
			const result = await getMediaInfoApi(api).getPlaybackInfo({
				itemId: itemId,
				userId: userId,
			});
			return result.data;
		},
	});

	const episodes = useQuery({
		queryKey: ["videoPlayer", itemId, "episodes"],
		queryFn: async () => {
			const result = await getTvShowsApi(api).getEpisodes({
				userId: userId,
				seriesId: seriesId,
				fields: [ItemFields.MediaSources],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
	});

	const currentEpisodeIndex = episodes.data?.Items?.findIndex(
		(item) => item.Id == itemId,
	);

	const [currentSubtrack] = useState(subtitleStreamIndex);

	const [showControls, setShowControls] = useState(false);

	const playerRef = useRef();
	const [isSeeking, setIsSeeking] = useState(false);
	const [isBuffering, setIsBuffering] = useState(true);
	const [isPlaying, setIsPlaying] = useState(true);
	const [isMuted, setIsMuted] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [isPIP, setIsPIP] = useState(false);
	const [volume, setVolume] = useState(0.8);

	const [progress, setProgress] = useState(0);
	const [currentTime, setCurrentTime] = useState(startPosition);

	const onReady = useCallback(async () => {
		if (!isReady) {
			const timeToStart = ticksToSec(startPosition);
			await getPlaystateApi(api).reportPlaybackStart({
				playbackStartInfo: {
					PlayMethod: mediaInfo.data?.MediaSources[0]
						.SupportsDirectPlay
						? "DirectPlay"
						: mediaInfo.data?.MediaSources[0]
								.SupportsDirectStream
						? "DirectStream"
						: "Transcode",
					AudioStreamIndex: audioStreamIndex,
					SubtitleStreamIndex: subtitleStreamIndex,
					userId: userId,
					CanSeek: true,
					ItemId: itemId,
					MediaSourceId: mediaInfo.data?.MediaSources[0].Id,
					PlaySessionId: mediaInfo.data?.PlaySessionId,
				},
			});
			console.log(startPosition);
			playerRef.current.seekTo(timeToStart, "seconds");
			setIsReady(true);
		}
	}, [isReady]);

	const handleDisplayCurrentTime = () => {
		let time = ticksToSec(progress * itemDuration);
		let hr = Math.floor(time / 3600);
		time -= hr * 3600;
		let min = Math.floor(time / 60);
		time -= min * 60;
		return `${hr.toLocaleString([], {
			minimumIntegerDigits: 2,
			maximumFractionDigits: 0,
		})}:${min.toLocaleString([], {
			minimumIntegerDigits: 2,
			maximumFractionDigits: 0,
		})}:${time.toLocaleString([], {
			minimumIntegerDigits: 2,
			maximumFractionDigits: 0,
		})}`;
	};

	const handleDisplayTime = (ticks) => {
		let time = ticksToSec(ticks);
		let hr = Math.floor(time / 3600);
		time -= hr * 3600;
		let min = Math.floor(time / 60);
		time -= min * 60;
		return `${hr.toLocaleString([], {
			minimumIntegerDigits: 2,
			maximumFractionDigits: 0,
		})}:${min.toLocaleString([], {
			minimumIntegerDigits: 2,
			maximumFractionDigits: 0,
		})}:${time.toLocaleString([], {
			minimumIntegerDigits: 2,
			maximumFractionDigits: 0,
		})}`;
	};

	const handlePlayNextEpisode = () => {
		// Reset Player time state
		setProgress(0);
		setCurrentTime(0);
		setIsPlaying(true);

		setUserId(userId);

		// Set all required stream index
		setAudioStreamIndex(0);
		setVideoStreamIndex(0);
		setSubtitleStreamIndex(0);

		setMediaSourceId(episodes.data.Items[currentEpisodeIndex + 1].Id);

		setUrl(
			`${api.basePath}/Videos/${
				episodes.data.Items[currentEpisodeIndex + 1].Id
			}/stream.
					${episodes.data.Items[currentEpisodeIndex + 1].MediaSources[0].Container}
				?Static=true&mediaSourceId=${
					episodes.data.Items[currentEpisodeIndex + 1].Id
				}&deviceId=${api.deviceInfo.id}&api_key=${
				api.accessToken
			}&Tag=${
				episodes.data.Items[currentEpisodeIndex + 1].MediaSources[0]
					.ETag
			}&videoStreamIndex=${0}&audioStreamIndex=${0}`,
		);
		setPosition(
			episodes.data.Items[currentEpisodeIndex + 1].UserData
				?.PlaybackPositionTicks,
		);

		setSeriesId(episodes.data.Items[currentEpisodeIndex + 1].SeriesId);
		if (
			episodes.data.Items[currentEpisodeIndex + 1].ImageBlurHashes.Logo
		) {
			setItemName(
				<div className="video-osd-name">
					<img
						src={`${api.basePath}/Items/${
							episodes.data.Items[currentEpisodeIndex + 1]
								.SeriesId
						}/Images/Logo`}
						className="video-osd-name-logo"
						onLoad={(e) => {
							e.target.style.opacity = 1;
						}}
					/>
					<Typography variant="subtitle1">
						S
						{
							episodes.data.Items[currentEpisodeIndex + 1]
								.ParentIndexNumber
						}
						:E
						{
							episodes.data.Items[currentEpisodeIndex + 1]
								.IndexNumber
						}{" "}
						{
							episodes.data.Items[currentEpisodeIndex + 1]
								.Name
						}
					</Typography>
				</div>,
			);
		} else {
			setItemName(
				<div className="video-osd-name">
					<Typography variant="h6">
						{
							episodes.data.Items[currentEpisodeIndex + 1]
								.SeriesName
						}
					</Typography>
					<Typography variant="subtitle1">
						S
						{
							episodes.data.Items[currentEpisodeIndex + 1]
								.ParentIndexNumber
						}
						:E
						{
							episodes.data.Items[currentEpisodeIndex + 1]
								.IndexNumber
						}{" "}
						{
							episodes.data.Items[currentEpisodeIndex + 1]
								.Name
						}
					</Typography>
				</div>,
			);
		}

		setItemId(episodes.data.Items[currentEpisodeIndex + 1].Id);
		setDurationStore(
			episodes.data.Items[currentEpisodeIndex + 1].RunTimeTicks,
		);

		// navigate("player");
	};
	const handlePlayPrevEpisode = () => {
		// Reset video player state
		setProgress(0);
		setCurrentTime(0);
		setIsPlaying(true);

		setUserId(userId);

		// Set all required stream index
		setAudioStreamIndex(0);
		setVideoStreamIndex(0);
		setSubtitleStreamIndex(0);

		setMediaSourceId(episodes.data.Items[currentEpisodeIndex - 1].Id);

		setUrl(
			`${api.basePath}/Videos/${
				episodes.data.Items[currentEpisodeIndex - 1].Id
			}/stream.
					${episodes.data.Items[currentEpisodeIndex - 1].MediaSources[0].Container}
				?Static=true&mediaSourceId=${
					episodes.data.Items[currentEpisodeIndex - 1].Id
				}&deviceId=${api.deviceInfo.id}&api_key=${
				api.accessToken
			}&Tag=${
				episodes.data.Items[currentEpisodeIndex - 1].MediaSources[0]
					.ETag
			}&videoStreamIndex=${0}&audioStreamIndex=${0}`,
		);
		setPosition(
			episodes.data.Items[currentEpisodeIndex - 1].UserData
				?.PlaybackPositionTicks,
		);

		setSeriesId(episodes.data.Items[currentEpisodeIndex - 1].SeriesId);
		if (
			episodes.data.Items[currentEpisodeIndex - 1].ImageBlurHashes.Logo
		) {
			setItemName(
				<div className="video-osd-name">
					<img
						src={`${api.basePath}/Items/${
							episodes.data.Items[currentEpisodeIndex - 1]
								.SeriesId
						}/Images/Logo`}
						className="video-osd-name-logo"
						onLoad={(e) => {
							e.target.style.opacity = 1;
						}}
					/>
					<Typography variant="subtitle1">
						S
						{
							episodes.data.Items[currentEpisodeIndex - 1]
								.ParentIndexNumber
						}
						:E
						{
							episodes.data.Items[currentEpisodeIndex - 1]
								.IndexNumber
						}{" "}
						{
							episodes.data.Items[currentEpisodeIndex - 1]
								.Name
						}
					</Typography>
				</div>,
			);
		} else {
			setItemName(
				<div className="video-osd-name">
					<Typography variant="h6">
						{
							episodes.data.Items[currentEpisodeIndex - 1]
								.SeriesName
						}
					</Typography>
					<Typography variant="subtitle1">
						S
						{
							episodes.data.Items[currentEpisodeIndex - 1]
								.ParentIndexNumber
						}
						:E
						{
							episodes.data.Items[currentEpisodeIndex - 1]
								.IndexNumber
						}{" "}
						{
							episodes.data.Items[currentEpisodeIndex - 1]
								.Name
						}
					</Typography>
				</div>,
			);
		}

		setItemId(episodes.data.Items[currentEpisodeIndex - 1].Id);
		setDurationStore(
			episodes.data.Items[currentEpisodeIndex - 1].RunTimeTicks,
		);

		// navigate("player");
	};

	const [appFullscreen, setAppFullScreen] = useState(false);

	useEffect(() => {
		if (showControls) {
			let timeout = setTimeout(() => {
				setShowControls(false);
			}, 5000);
			return () => {
				clearTimeout(timeout);
			};
		}
	}, [showControls]);

	const handleKeyPress = useCallback((event) => {
		switch (event.key) {
			case "ArrowRight":
				playerRef.current.seekTo(
					playerRef.current.getCurrentTime() + 15,
				);
				break;
			case "ArrowLeft":
				playerRef.current.seekTo(
					playerRef.current.getCurrentTime() - 15,
				);
				break;
			case " ":
				setIsPlaying((state) => !state);
				break;
			case "ArrowUp":
				setVolume((state) => (state <= 0.9 ? state + 0.1 : state));
				break;
			case "ArrowDown":
				setVolume((state) => (state >= 0.1 ? state - 0.1 : state));
				break;
			case "F":
			case "f":
				setAppFullScreen((state) => !state);
				break;
			case "P":
			case "p":
				setIsPIP((state) => !state);
				break;
			case "M":
			case "m":
				setIsMuted((state) => !state);
				break;
			default:
				console.log(event.key);
				break;
		}
	}, []);

	useEffect(() => {
		appWindow.setFullscreen(appFullscreen);
	}, [appFullscreen]);

	useEffect(() => {
		// attach the event listener
		document.addEventListener("keydown", handleKeyPress);

		// remove the event listener
		return () => {
			document.removeEventListener("keydown", handleKeyPress);
		};
	}, [handleKeyPress]);

	const [showVolume, setShowVolume] = useState(false);

	// Show/Hide volume Indicator
	useEffect(() => {
		setShowVolume(true);
		const timeout = setTimeout(() => {
			setShowVolume(false);
		}, 5000);
		return () => {
			clearTimeout(timeout);
		};
	}, [volume]);

	const handleExit = async () => {
		// Remove app from fullscreen
		await appWindow.setFullscreen(false);
		navigate(-1);

		// Reset playback store
		setUrl("");
		setPosition(0);
		setDurationStore(0);
		setItemId("");
		setItemName("");
		setAudioStreamIndex(0);
		setVideoStreamIndex(0);
		setSubtitleStreamIndex(0);
		setMediaSourceId("");
		setUserId("");
		setSeriesId("");
	};

	const handleOnEnd = () => {
		console.log("Playback ended");
		if (seriesId) {
			if (episodes.isSuccess && episodes.data.TotalRecordCount > 0) {
				handlePlayNextEpisode();
			}
		} else {
			handleExit();
		}
	};

	const onProgress = async (e) => {
		if (!isSeeking) {
			setProgress(e.played);
			setCurrentTime(secToTicks(e.playedSeconds));
		}
		await getPlaystateApi(api).reportPlaybackProgress({
			playbackProgressInfo: {
				PlayMethod: mediaInfo.data?.MediaSources[0]
					.SupportsDirectPlay
					? "DirectPlay"
					: mediaInfo.data?.MediaSources[0].SupportsDirectStream
					? "DirectStream"
					: "Transcode",
				ItemId: itemId,
				IsMuted: isMuted,
				PositionTicks: secToTicks(e.playedSeconds),
				PlaybackStartTimeTicks: startPosition,
				VolumeLevel: volume * 100,
				IsPaused: !isPlaying,
				AudioStreamIndex: audioStreamIndex,
				Brightness: 100,
				CanSeek: true,
				MediaSourceId: mediaInfo.data?.MediaSources[0].Id,
				SubtitleStreamIndex: subtitleStreamIndex,
				PlaySessionId: mediaInfo.data?.PlaySessionId,
			},
		});
		if (Math.round(e.playedSeconds) == ticksToSec(itemDuration)) {
			handleOnEnd();
		}
	};

	return (
		<div
			className="video-player-container"
			style={{ background: "black" }}
			onMouseMove={() => {
				setShowControls(true);
			}}
			key={itemId}
		>
			<AnimatePresence>
				{showVolume && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						style={{
							position: "absolute",
							top: "4em",
							right: "4em",
							background: "rgb(0 0 0/ 0.5)",
							backdropFilter: "blur(10px)",
							width: "10em",
							height: "10em",
							padding: "1em",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexDirection: "column",
							borderRadius: "10px",
							border: "2px solid rgb(255 255 255 / 0.2)",
							gap: "2em",
						}}
					>
						<MdiVolumeHigh style={{ fontSize: "3em" }} />
						<LinearProgress
							variant="determinate"
							value={volume * 100}
							style={{
								width: "8em",
								margin: "0 1em",
							}}
						/>
					</motion.div>
				)}
			</AnimatePresence>
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					opacity: isBuffering ? 1 : 0,
					transition: "opacity 250ms",
				}}
			>
				<CircularProgress />
			</div>
			<Backdrop
				className={
					showControls
						? "video-osd video-osd-visible"
						: "video-osd"
				}
				sx={{
					display: "flex",
					flexDirection: "column",
					zIndex: 1000,
					justifyContent: "space-between",
					background: "transparent",
				}}
				open={showControls}
			>
				<div
					style={{
						background:
							"linear-gradient(to bottom, rgb(0 0 0 / 0.75), transparent)",
						width: "100vw",
						display: "flex",
						alignItems: "center",
						padding: "0.85em 1.2em",
					}}
				>
					<IconButton onClick={handleExit}>
						<MdiArrowLeft />
					</IconButton>

					{itemName}
				</div>
				<Stack
					direction="column"
					padding={2}
					width="100%"
					sx={{
						background:
							"linear-gradient(to top, rgb(0 0 0 / 0.75), transparent)",
					}}
				>
					<Stack
						width="100%"
						direction="row"
						alignItems="center"
						justifyContent="center"
						gap={2}
					>
						<Typography variant="h6">
							{handleDisplayCurrentTime()}
						</Typography>
						<Slider
							value={currentTime ? currentTime : 0}
							step={0.01}
							max={itemDuration}
							onChange={(e, newVal) => {
								setIsSeeking(true);
								setCurrentTime(newVal);
							}}
							onChangeCommitted={(e, newVal) => {
								playerRef.current.seekTo(
									ticksToSec(newVal),
								);
								setCurrentTime(newVal);
								setIsSeeking(false);
							}}
							valueLabelDisplay="auto"
							valueLabelFormat={(value) =>
								handleDisplayTime(value)
							}
							// size="medium"
							sx={{
								"& .MuiSlider-valueLabel": {
									lineHeight: 1.2,
									fontSize: 24,
									background: "rgb(0 0 0 / 0.5)",
									backdropFilter: "blur(5px)",
									padding: 1,
									borderRadius: "10px",
									border: "1px solid rgb(255 255 255 / 0.15)",
									boxShadow:
										"0 0 10px rgb(0 0 0 / 0.4) ",
									transform:
										"translatey(-120%) scale(0)",
									"&:before": { display: "none" },
									"&.MuiSlider-valueLabelOpen": {
										transform:
											"translateY(-120%) scale(1)",
									},
									"& > *": {
										transform: "rotate(0deg)",
									},
								},
							}}
						/>
						<Typography variant="h6">
							{handleDisplayTime(itemDuration)}
						</Typography>
					</Stack>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
					>
						<Stack
							direction="row"
							gap={1}
							justifyContent="center"
							alignItems="center"
						>
							<IconButton
								onClick={handlePlayPrevEpisode}
								disabled={
									seriesId
										? episodes.isPending ||
										  currentEpisodeIndex == 0
										: true
								}
							>
								<MdiSkipPrevious />
							</IconButton>
							<IconButton
								onClick={() =>
									playerRef.current.seekTo(
										playerRef.current.getCurrentTime() -
											15,
									)
								}
							>
								<MdiRewind />
							</IconButton>
							<IconButton
								onClick={() => setIsPlaying(!isPlaying)}
							>
								{isPlaying ? <MdiPause /> : <MdiPlay />}
							</IconButton>
							<IconButton
								onClick={() =>
									playerRef.current.seekTo(
										playerRef.current.getCurrentTime() +
											15,
									)
								}
							>
								<MdiFastForward />
							</IconButton>
							<IconButton
								onClick={handlePlayNextEpisode}
								disabled={
									seriesId
										? episodes.isPending ||
										  episodes.data
												?.TotalRecordCount ==
												currentEpisodeIndex +
													1
										: true
								}
							>
								<MdiSkipNext />
							</IconButton>
							<Typography variant="subtitle1">
								{endsAt(itemDuration - currentTime)}
							</Typography>
						</Stack>
						<Stack
							direction="row"
							gap={1}
							alignItems="center"
							justifyContent="center"
						>
							<Box>
								<Menu
									anchorEl={speedMenuEl}
									open={speedMenuState}
									onClose={() =>
										setSpeedMenuEl(null)
									}
									MenuListProps={{
										"aria-labelledby":
											"lock-button",
										role: "listbox",
									}}
									anchorOrigin={{
										vertical: "top",
										horizontal: "center",
									}}
									transformOrigin={{
										vertical: "bottom",
										horizontal: "center",
									}}
									sx={{
										mb: 20,
									}}
								>
									{availableSpeeds.map(
										(sspeed, index) => {
											return (
												<MenuItem
													key={sspeed}
													selected={
														index ===
														speed
													}
													onClick={() => {
														setSpeed(
															index,
														);
														setSpeedMenuEl(
															null,
														);
													}}
													sx={{
														width: 160,
													}}
												>
													{sspeed}x
												</MenuItem>
											);
										},
									)}
								</Menu>
								<IconButton
									onClick={(e) =>
										setSpeedMenuEl(
											e.currentTarget,
										)
									}
								>
									<MdiPlaySpeed />
								</IconButton>
							</Box>
							<IconButton
								sx={{
									ml: 0.1,
								}}
								onClick={() => setIsMuted(!isMuted)}
							>
								{isMuted ? (
									<MdiVolumeOff />
								) : (
									<MdiVolumeHigh />
								)}
							</IconButton>
							<Slider
								value={isMuted ? 0 : volume * 100}
								step={1}
								max={100}
								onChange={(e, newVal) =>
									setVolume(newVal / 100)
								}
								valueLabelDisplay="auto"
								valueLabelFormat={(value) =>
									Math.floor(value)
								}
								size="small"
								sx={{
									mr: 1,
									ml: 1,
									width: "8em",
									"& .MuiSlider-valueLabel": {
										lineHeight: 1.2,
										fontSize: 24,
										background:
											"rgb(0 0 0 / 0.5)",
										backdropFilter: "blur(5px)",
										padding: 1,
										borderRadius: "10px",
										border: "1px solid rgb(255 255 255 / 0.15)",
										boxShadow:
											"0 0 10px rgb(0 0 0 / 0.4) ",
										transform:
											"translatey(-120%) scale(0)",
										"&:before": {
											display: "none",
										},
										"&.MuiSlider-valueLabelOpen":
											{
												transform:
													"translateY(-120%) scale(1)",
											},
										"& > *": {
											transform:
												"rotate(0deg)",
										},
									},
								}}
							/>
							<Box>
								<Menu
									anchorEl={settingsMenuEl}
									onClose={() => {
										setSettingsMenuEl(null);
									}}
									open={settingsMenuState}
									sx={{ padding: 2 }}
								>
									<Stack direction="row">
										<Typography variant="h6">
											Subtitle
										</Typography>
									</Stack>
								</Menu>
								<IconButton
									onClick={(e) =>
										setSettingsMenuEl(
											e.currentTarget,
										)
									}
									disabled
								>
									<MdiCog />
								</IconButton>
							</Box>
							<IconButton
								onClick={() => {
									setIsPIP(!isPIP);
								}}
							>
								<MdiPictureInPictureBottomRight />
							</IconButton>
							<IconButton
								onClick={async () => {
									let fstate =
										await appWindow.isFullscreen();
									setAppFullScreen(!fstate);
								}}
							>
								{appFullscreen ? (
									<MdiFullscreenExit />
								) : (
									<MdiFullscreen />
								)}
							</IconButton>
						</Stack>
					</Stack>
				</Stack>
			</Backdrop>
			<ReactPlayer
				ref={playerRef}
				width="100vw"
				height="100vh"
				playing={isPlaying}
				url={url}
				onProgress={onProgress}
				onReady={onReady}
				muted={isMuted}
				pip={isPIP}
				volume={volume}
				onBuffer={() => setIsBuffering(true)}
				onBufferEnd={() => setIsBuffering(false)}
				config={{
					file: {
						attributes: {
							crossOrigin: "true",
						},
						tracks: [
							{
								kind: "subtitles",
								src: `${api.basePath}/Videos/${itemId}/${itemId}/Subtitles/${currentSubtrack}/Stream.vtt?api_key=${api.accessToken}`,
								srcLang: "",
								default: true,
								mode: "showing",
							},
						],
					},
				}}
				playbackRate={availableSpeeds[speed]}
			/>
		</div>
	);
};
