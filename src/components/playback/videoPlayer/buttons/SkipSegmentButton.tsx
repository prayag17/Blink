import { Button } from "@mui/material";
import React from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const SkipSegmentButton = () => {
	const { mediaSegments, currentSegmentIndex, skipSegment } = usePlaybackStore(
		useShallow((state) => ({
			mediaSegments: state.metadata.mediaSegments,
			currentSegmentIndex: state.nextSegmentIndex - 1,
			skipSegment: state.skipSegment,
		})),
	);

	if (!mediaSegments?.Items?.length || currentSegmentIndex < 0) {
		return <></>; // No segments to skip
	}

	console.log("Current Segment Index:", currentSegmentIndex);
	console.log("Media Segments:", mediaSegments);

	return (
		<Button
			variant="outlined"
			size="large"
			//@ts-ignore
			color="white"
			style={{
				position: "absolute",
				bottom: "18vh",
				right: "2em",
				zIndex: 10000,
			}}
			onClick={skipSegment}
		>
			Skip {mediaSegments?.Items?.[currentSegmentIndex].Type}
		</Button>
	);
};

export default SkipSegmentButton;
