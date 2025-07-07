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

	React.useEffect(() => {
		navigator.mediaSession.setActionHandler("seekbackward", (details) => {
			if (details.seekOffset) {
				seekBackward(details.seekOffset);
			} else {
				seekBackward(10); // Default to 10 seconds
			}
		});
	}, [seekBackward]);

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
