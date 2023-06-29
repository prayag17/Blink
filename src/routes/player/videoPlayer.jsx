/** @format */
import { appWindow } from "@tauri-apps/api/window";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import CircularProgress from "@mui/material/CircularProgress";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Backdrop from "@mui/material/Backdrop";

import ReactPlayer from "react-player";

import { usePlaybackStore } from "../../utils/store/playback";
import { MdiArrowLeft } from "../../components/icons/mdiArrowLeft";
import { MdiPlay } from "../../components/icons/mdiPlay";

import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState, useCallback, useEffect } from "react";
import { secToTicks, ticksToSec } from "../../utils/date/time";

import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";

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

import useKeyPress from "../../utils/hooks/useKeyPress";
import { MdiCog } from "../../components/icons/mdiCog";

export const VideoPlayer = () => {
	const navigate = useNavigate();

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
		subtitleTracksStore,
		selectedSubtitleTrack,
	] = usePlaybackStore((state) => [
		state.url,
		state.startPosition,
		state.duration,
		state.itemId,
		state.itemName,
		state.subtitleTracks,
		state.selectedSubtitleTrack,
	]);
	const [currentSubtrack, setCurrentSubtrack] = useState(
		selectedSubtitleTrack,
	);

	const [showControls, setShowControls] = useState(false);

	const playerRef = useRef();
	const [isSeeking, setIsSeeking] = useState(false);
	const [isBuffering, setIsBuffering] = useState(true);
	const [isPlaying, setIsPlaying] = useState(true);
	const [isMuted, setIsMuted] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [isPIP, setIsPIP] = useState(false);
	const [volume, setVolume] = useState(0.8);

	const [showVolume, setShowVolume] = useState(false);

	const [duration, setDuration] = useState(0);
	const [progress, setProgress] = useState(0);
	const [currentTime, setCurrentTime] = useState(startPosition);

	const onReady = useCallback(() => {
		if (!isReady) {
			const timeToStart = ticksToSec(startPosition);
			playerRef.current.seekTo(timeToStart, "seconds");
			setDuration(playerRef.current.getDuration());
			setIsReady(true);
			const player = playerRef.current.getInternalPlayer();
			console.log(player.config);
		}
	}, [isReady]);

	const onProgress = async (e) => {
		if (!isSeeking) {
			setProgress(e.played);
			setCurrentTime(secToTicks(e.playedSeconds));
		}
		await getPlaystateApi(window.api).reportPlaybackProgress({
			playbackProgressInfo: {
				ItemId: itemId,
				IsMuted: isMuted,
				PositionTicks: secToTicks(e.playedSeconds),
				PlaybackStartTimeTicks: startPosition,
				VolumeLevel: volume * 100,
				IsPaused: !isPlaying,
			},
		});
	};

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

	const [appFullscreen, setAppFullScreen] = useState(false);

	useEffect(() => {
		let timeout = null;
		if (showControls) {
			window.clearTimeout(timeout);
			timeout = setTimeout(() => {
				setShowControls(false);
			}, 5000);
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
			case "p":
				setIsPlaying(!isPlaying);
			default:
				console.log(event.key);
				break;
		}
	}, []);

	const [subs, setSubs] = useState([]);

	useEffect(() => {
		setSubs(
			subtitleTracksStore.map((sub, index) => {
				return {
					kind: "subtitles",
					src: `${window.api.basePath}/Videos/${itemId}/${itemId}/Subtitles/${sub.Index}/Stream.vtt?api_key=${window.api.accessToken}`,
					srcLang: sub?.Language,
					default: false,
					mode:
						sub.Index == currentSubtrack
							? "showing"
							: "hidden",
				};
			}),
		);
	}, [subtitleTracksStore]);

	return (
		<Box
			className="video"
			sx={{ background: "black" }}
			onMouseMove={() => {
				setShowControls(true);
			}}
		>
			<Box
				sx={{
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
			</Box>
			<Backdrop
				className="video-osd"
				sx={{
					display: "flex",
					flexDirection: "column",
					zIndex: 100000,
					justifyContent: "space-between",
					background: "transparent",
				}}
				open={showControls}
			>
				<AppBar
					position="static"
					elevation={0}
					sx={{
						background:
							"linear-gradient(to bottom, rgb(0 0 0 / 0.75), transparent)",
					}}
				>
					<Toolbar>
						<IconButton onClick={() => navigate(-1)}>
							<MdiArrowLeft />
						</IconButton>
						<Typography ml={2} variant="h6">
							{itemName}
						</Typography>
					</Toolbar>
				</AppBar>
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
							value={currentTime}
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
										vertical: "bottom",
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
								sx={{
									mr: 1,
									ml: 1,
									width: "10em",
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
									await appWindow.setFullscreen(
										!fstate,
									);
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
						tracks: [],
						// tracks: subtitleTracksStore.map((sub, index) => {
						// 	return {
						// 		kind: "subtitles",
						// 		src: `${window.api.basePath}/Videos/${itemId}/${itemId}/Subtitles/${sub.Index}/Stream.vtt?api_key=${window.api.accessToken}`,
						// 		srcLang: sub?.Language,
						// 		default: false,
						// 		mode:
						// 			sub.Index == currentSubtrack
						// 				? "showing"
						// 				: "hidden",
						// 	};
						// }),
					},
				}}
				playbackRate={availableSpeeds[speed]}
			/>
		</Box>
	);
};
