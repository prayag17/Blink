/** @format */
import { appWindow } from "@tauri-apps/api/window";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import ReactPlayer from "react-player";

import { usePlaybackStore } from "../../utils/store/playback";
import { MdiArrowLeft } from "../../components/icons/mdiArrowLeft";

import { useNavigate } from "react-router-dom";
import { useRef, useState, useCallback } from "react";
import { secToTicks, ticksToSec } from "../../utils/date/time";

import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";

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
	return (
		<Box sx={{ background: "black" }}>
			<AppBar
				position="fixed"
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
			<ReactPlayer
				ref={playerRef}
				width="100vw"
				height="100vh"
				playing={true}
				url={url}
				controls={true}
				onProgress={onProgress}
				onReady={onReady}
				muted={isMuted}
			/>
		</Box>
	);
};
