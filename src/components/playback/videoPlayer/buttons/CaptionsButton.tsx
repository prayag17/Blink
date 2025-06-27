import { IconButton } from "@mui/material";
import React, { useTransition } from "react";
import { useShallow } from "zustand/shallow";
import { toggleSubtitleTrack, usePlaybackStore } from "@/utils/store/playback";

const CaptionsButton = () => {
	const { subtitle } = usePlaybackStore(
		useShallow((state) => ({ subtitle: state.mediaSource.subtitle })),
	);

	const [subtitleIsChanging, startSubtitleChange] = useTransition();

	return (
		<IconButton
			disabled={subtitle?.allTracks?.length === 0 || subtitleIsChanging}
			onClick={() => startSubtitleChange(toggleSubtitleTrack)}
		>
			<span className={"material-symbols-rounded"}>
				{subtitle?.enable ? "closed_caption" : "closed_caption_disabled"}
			</span>
		</IconButton>
	);
};

export default CaptionsButton;
