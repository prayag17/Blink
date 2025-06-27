import { IconButton } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const NextChapterButton = () => {
	const { seekToNextChapter } = usePlaybackStore(
		useShallow((state) => ({
			seekToNextChapter: state.seekToNextChapter,
		})),
	);
	return (
		<IconButton onClick={() => seekToNextChapter()}>
			<span className="material-symbols-rounded fill">last_page</span>
		</IconButton>
	);
};

export default NextChapterButton;
