import { IconButton } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const PlayPauseButton = () => {
	const { isPlayerPlaying, toggleIsPlaying } = usePlaybackStore(
		useShallow((state) => ({
			isPlayerPlaying: state.playerState.isPlayerPlaying,
			toggleIsPlaying: state.toggleIsPlaying,
		})),
	);
	return (
		<IconButton onClick={toggleIsPlaying}>
			<span className="material-symbols-rounded fill">
				{isPlayerPlaying ? "pause" : "play_arrow"}
			</span>
		</IconButton>
	);
};

export default PlayPauseButton;
