import { IconButton } from "@mui/material";
import React, { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const ForwardButton = () => {
	const { seekForward } = usePlaybackStore(
		useShallow((state) => ({
			seekForward: state.seekForward,
		})),
	);

	useEffect(() => {
		navigator.mediaSession.setActionHandler("seekforward", (details) => {
			if (details.seekOffset) {
				seekForward(details.seekOffset);
			} else {
				seekForward(10); // Default to 10 seconds
			}
		});
	}, [seekForward]);

	return (
		<IconButton onClick={() => seekForward(15)}>
			<span className="material-symbols-rounded fill">fast_forward</span>
		</IconButton>
	);
};

export default ForwardButton;
