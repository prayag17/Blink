import { Typography } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { endsAt } from "@/utils/date/time";
import { usePlaybackStore } from "@/utils/store/playback";

const EndsAtDisplay = () => {
	const { currentTime, itemDuration } = usePlaybackStore(
		useShallow((state) => ({
			currentTime: state.playerState.currentTime,
			itemDuration:
				state.metadata.itemDuration ?? state.metadata.item?.RunTimeTicks,
		})),
	);

	if (!itemDuration) return <Typography variant="subtitle1">--:--</Typography>;

	const remaining = itemDuration - (currentTime ?? 0);

	return (
		<Typography variant="subtitle1">
			{endsAt(remaining)}
		</Typography>
	);
};

export default EndsAtDisplay;
