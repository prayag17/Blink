import { IconButton } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const FullscreenButton = () => {
	const { isPlayerFullscreen, toggleIsPlayerFullscreen } = usePlaybackStore(
		useShallow((state) => ({
			isPlayerFullscreen: state.playerState.isPlayerFullscreen,
			toggleIsPlayerFullscreen: state.toggleIsPlayerFullscreen,
		})),
	);

	return (
		<IconButton onClick={toggleIsPlayerFullscreen}>
			<span className="material-symbols-rounded fill">
				{isPlayerFullscreen ? "fullscreen_exit" : "fullscreen"}
			</span>
		</IconButton>
	);
};

export default FullscreenButton;
