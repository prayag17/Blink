import { Button } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const SkipSegmentButton = () => {
	const {
		mediaSegments,
		currentSegmentIndex,
		skipSegment,
		activeSegmentId,
		isUserHovering,
		isPlayerPlaying,
		isUserSeeking,
	} = usePlaybackStore(
		useShallow((state) => ({
			mediaSegments: state.metadata.mediaSegments,
			currentSegmentIndex: state.nextSegmentIndex - 1,
			skipSegment: state.skipSegment,
			activeSegmentId: state.activeSegmentId,
			isUserHovering: state.playerState.isUserHovering,
			isPlayerPlaying: state.playerState.isPlayerPlaying,
			isUserSeeking: state.playerState.isUserSeeking,
		})),
	);

	if (
		!mediaSegments?.Items?.length ||
		currentSegmentIndex < 0 ||
		!activeSegmentId
	) {
		return null; // No segments to skip
	}

	return (
		<Button
			variant="outlined"
			size="large"
			//@ts-ignore
			color="white"
			style={{
				position: "absolute",
				bottom:
					isUserHovering || !isPlayerPlaying || isUserSeeking ? "18vh" : "2em",
				right: "2em",
				transition: "bottom 0.3s ease-in-out",
				zIndex: 10000,
			}}
			onClick={skipSegment}
		>
			Skip {mediaSegments?.Items?.[currentSegmentIndex].Type}
		</Button>
	);
};

const SkipSegmentButtonMemo = React.memo(SkipSegmentButton);

export default SkipSegmentButtonMemo;
