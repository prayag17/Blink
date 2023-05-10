/** @format */
import { appWindow } from "@tauri-apps/api/window";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

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

export const VideoPlayer = () => {
	const navigate = useNavigate();

	const playerRef = useRef();
	const [isPlaying, setIsPlaying] = useState(true);
	const [isMuted, setIsMuted] = useState(false);
	const [isReady, setIsReady] = useState(false);

	const onReady = useCallback(() => {
		if (!isReady) {
			const timeToStart = ticksToSec(startPosition);
			playerRef.current.seekTo(timeToStart, "seconds");
			setIsReady(true);
		}
	}, [isReady]);

	const onProgress = async (e) => {
		console.log(e);
		await getPlaystateApi(window.api).reportPlaybackProgress({
			playbackProgressInfo: {
				ItemId: itemId,
				IsMuted: isMuted,
				PositionTicks: secToTicks(e.playedSeconds),
				PlaybackStartTimeTicks: startPosition,
			},
		});
	};

	const [url, startPosition, itemId, itemName] = usePlaybackStore(
		(state) => [
			state.url,
			state.startPosition,
			state.itemId,
			state.itemName,
		],
	);

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
				<Stack padding={2} direction="row">
					<IconButton
						onClick={() =>
							playerRef.current.seekTo(
								playerRef.current.getCurrentTime() - 15,
							)
						}
					>
						<MdiRewind />
					</IconButton>
					<IconButton onClick={() => setIsPlaying(!isPlaying)}>
						{isPlaying ? <MdiPause /> : <MdiPlay />}
					</IconButton>
					<IconButton
						onClick={() =>
							playerRef.current.seekTo(
								playerRef.current.getCurrentTime() + 15,
							)
						}
					>
						<MdiFastForward />
					</IconButton>
				</Stack>
			</Stack>
			<ReactPlayer
				ref={playerRef}
				width="100vw"
				height="100vh"
				playing={isPlaying}
				url={url}
				// controls={true}
				onProgress={onProgress}
				onReady={onReady}
				muted={isMuted}
			/>
		</Box>
	);
};
