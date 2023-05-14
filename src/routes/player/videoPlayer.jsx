/** @format */
import { appWindow } from "@tauri-apps/api/window";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";

import ReactPlayer from "react-player";

import { usePlaybackStore } from "../../utils/store/playback";
import { MdiArrowLeft } from "../../components/icons/mdiArrowLeft";
import { MdiPlay } from "../../components/icons/mdiPlay";

import { useNavigate } from "react-router-dom";
import { useRef, useState, useCallback } from "react";
import { secToTicks, ticksToSec } from "../../utils/date/time";

import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";

import "./videoPlayer.module.scss";
import { MdiPause } from "../../components/icons/mdiPause";
import { MdiFastForward } from "../../components/icons/mdiFastForward";
import { MdiRewind } from "../../components/icons/mdiRewind";
import { MdiFullscreen } from "../../components/icons/mdiFullscreen";
import { MdiFullscreenExit } from "../../components/icons/mdiFullscreenExit";

export const VideoPlayer = () => {
	const navigate = useNavigate();
	const [url, startPosition, itemDuration, itemId, itemName] =
		usePlaybackStore((state) => [
			state.url,
			state.startPosition,
			state.duration,
			state.itemId,
			state.itemName,
		]);

	const playerRef = useRef();
	const [isPlaying, setIsPlaying] = useState(true);
	const [isMuted, setIsMuted] = useState(false);
	const [isReady, setIsReady] = useState(false);

	const [duration, setDuration] = useState(0);
	const [progress, setProgress] = useState(0);
	const [currentTime, setCurrentTime] = useState(
		(startPosition / itemDuration) * 100,
	);

	const onReady = useCallback(() => {
		if (!isReady) {
			const timeToStart = ticksToSec(startPosition);
			playerRef.current.seekTo(timeToStart, "seconds");
			setDuration(playerRef.current.getDuration());
			setIsReady(true);
		}
	}, [isReady]);

	const onProgress = async (e) => {
		setProgress(e.played);
		await getPlaystateApi(window.api).reportPlaybackProgress({
			playbackProgressInfo: {
				ItemId: itemId,
				IsMuted: isMuted,
				PositionTicks: secToTicks(e.playedSeconds),
				PlaybackStartTimeTicks: startPosition,
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

	const handleDisplayItemDuration = () => {
		let time = ticksToSec(itemDuration);
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

	const handleSeeking = useCallback((time, offset) => {
		playerRef.current.seekTo(time / 100);
		setCurrentTime(time / 100);
	}, []);

	const [appFullscreen, setAppFullScreen] = useState(false);

	let timer;
	return (
		<Box
			className="video"
			sx={{ background: "black" }}
			onMouseMove={(e) => {
				let a = "he";
				clearTimeout(timer);
				e.currentTarget.classList.add("video-osd-visible");
				timer = setTimeout(() => {
					document
						.querySelector(".video")
						.classList.remove("video-osd-visible");
				}, 2000);
			}}
		>
			<Stack
				className="video-osd"
				sx={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
				}}
				alignItems="center"
				justifyContent="space-between"
				direction="column"
				zIndex="10000000"
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
				<Stack direction="column" padding={2} width="100%">
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
							max={100}
							onChange={(e, newVal) => {
								playerRef.current.seekTo(
									(newVal / 100) *
										playerRef.current.getDuration(),
								);
								setCurrentTime(newVal);
							}}
						/>
						<Typography variant="h6">
							{handleDisplayItemDuration()}
						</Typography>
					</Stack>
					<Stack direction="row">
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
							onClick={async () => {
								let fstate =
									await appWindow.isFullscreen();
								setAppFullScreen(fstate);
								await appWindow.setFullscreen(!fstate);
							}}
						>
							{appFullscreen ? (
								<MdiFullscreen />
							) : (
								<MdiFullscreenExit />
							)}
						</IconButton>
					</Stack>
				</Stack>
			</Stack>
			<ReactPlayer
				ref={playerRef}
				width="100vw"
				height="100vh"
				playing={isPlaying}
				url={url}
				onProgress={onProgress}
				onReady={onReady}
				muted={isMuted}
			/>
		</Box>
	);
};
