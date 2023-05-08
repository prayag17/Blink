/** @format */

import React from "react";

import videojs from "video.js";

import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getVideosApi } from "@jellyfin/sdk/lib/utils/api/videos-api";

import Box from "@mui/material/Box";

// This imports the functional component from the previous sample.
import VideoJS from "../../components/player/video";
import { usePlaybackStore } from "../../utils/store/playback";

import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import { useNavigate } from "react-router-dom";
import { MdiChevronLeft } from "../../components/icons/mdiChevronLeft";

const VideoPlayer = () => {
	const url = usePlaybackStore((state) => state.url);

	const navigate = useNavigate();

	const playerRef = React.useRef(null);

	const videoJsOptions = {
		autoplay: true,
		controls: true,
		responsive: true,
		fill: true,
		sources: [
			{
				src: url,
				type: "video/mp4",
			},
		],
	};

	const handlePlayerReady = (player) => {
		playerRef.current = player;

		// You can handle player events here, for example:
		player.on("waiting", () => {
			videojs.log("player is waiting");
		});

		player.on("dispose", () => {
			videojs.log("player will dispose");
		});
	};

	return (
		<Box sx={{ height: "100vh", width: "100vw" }}>
			<AppBar position="fixed">
				<IconButton onClick={() => navigate(-1)}>
					<MdiChevronLeft />
				</IconButton>
			</AppBar>
			<VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
		</Box>
	);
};

export default VideoPlayer;
