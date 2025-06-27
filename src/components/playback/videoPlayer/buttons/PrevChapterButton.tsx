import { IconButton } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const PrevChapterButton = () => {
	const { seekToPrevChapter } = usePlaybackStore(
		useShallow((state) => ({
			seekToPrevChapter: state.seekToPrevChapter,
		})),
	);

	return (
		<IconButton onClick={seekToPrevChapter}>
			<span className="material-symbols-rounded fill">first_page</span>
		</IconButton>
	);
};

export default PrevChapterButton;
