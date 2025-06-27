import { IconButton } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const ForwardButton = () => {
	const { seekForward } = usePlaybackStore(
		useShallow((state) => ({
			seekForward: state.seekForward,
		})),
	);

	return (
		<IconButton onClick={() => seekForward(15)}>
			<span className="material-symbols-rounded fill">fast_forward</span>
		</IconButton>
	);
};

export default ForwardButton;
