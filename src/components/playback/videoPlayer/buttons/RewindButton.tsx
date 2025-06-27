import { IconButton } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const RewindButton = () => {
	const { seekBackward } = usePlaybackStore(
		useShallow((state) => ({
			seekBackward: state.seekBackward,
		})),
	);
	return (
		<IconButton
			onClick={() => {
				seekBackward(15);
			}}
		>
			<span className="material-symbols-rounded fill">fast_rewind</span>
		</IconButton>
	);
};

export default RewindButton;
