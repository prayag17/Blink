import { CircularProgress } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const LoadingIndicator = () => {
	const { isBuffering } = usePlaybackStore(
		useShallow((state) => ({
			isBuffering: state.playerState.isBuffering,
		})),
	);
	if (!isBuffering) {
		return null;
	}

	return (
		<div
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
		</div>
	);
};
export default LoadingIndicator;
