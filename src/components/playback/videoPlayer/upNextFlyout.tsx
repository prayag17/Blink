import { Button, Typography } from "@mui/material";
import { motion } from "motion/react";
import React, { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import { usePlaybackStore } from "@/utils/store/playback";
import useQueue from "@/utils/store/queue";

import "./upNextFlyout.scss";

const UpNextFlyout = () => {
	const {
		activeSegmentId,
		currentSegmemtIndex,
		mediaSegments,
		skipSegment,
		isUserHovering,
		isUserSeeking,
		isPlayerPlaying,
	} = usePlaybackStore(
		useShallow((state) => ({
			activeSegmentId: state.activeSegmentId,
			currentSegmemtIndex: state.nextSegmentIndex - 1,
			mediaSegments: state.metadata.mediaSegments,
			skipSegment: state.skipSegment,
			isUserHovering: state.playerState.isUserHovering,
			isUserSeeking: state.playerState.isUserSeeking,
			isPlayerPlaying: state.playerState.isPlayerPlaying,
		})),
	);

	const { nextItemIndex, tracks } = useQueue(
		useShallow((state) => ({
			nextItemIndex: state.currentItemIndex + 1,
			tracks: state.tracks,
		})),
	);
	const areControlsVisible = useMemo(() => {
		return isUserHovering || isUserSeeking || !isPlayerPlaying;
	}, [isUserHovering, isUserSeeking, isPlayerPlaying]);

	const api = useApiInContext((s) => s.api);

	if (
		!api ||
		!activeSegmentId ||
		mediaSegments?.Items?.[currentSegmemtIndex].Type !== "Outro"
	) {
		return null;
	}

	const item = tracks?.[nextItemIndex];
	if (!item || !item.Id) {
		return null;
	}

	return (
		<motion.div
			className={
				areControlsVisible
					? "video-player-up_next_flyout floating"
					: "video-player-up_next_flyout"
			}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
		>
			<img
				className="video-player-up_next_flyout-thumbnail"
				src={getImageUrlsApi(api).getItemImageUrlById(item.Id, "Primary", {
					tag: item.ImageTags?.Primary,
					quality: 80,
					fillWidth: 300,
				})}
				alt={"next item thumbnail"}
			/>
			<div className="video-player-up_next_flyout-details">
				<Typography variant="h5">
					{`S${item.ParentIndexNumber}:E${item.IndexNumber} `}
					{item.Name}
				</Typography>
				<Typography
					variant="subtitle2"
					// noWrap
					textOverflow="ellipsis"
					maxWidth="100%"
					sx={{
						display: "-webkit-box",
						webkitLineClamp: "3",
						webkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{item.Overview}
				</Typography>
				<Button
					onClick={skipSegment}
					variant="contained"
					color="primary"
					className="video-player-up_next_flyout-button"
				>
					Play
				</Button>
			</div>
		</motion.div>
	);
};

export default UpNextFlyout;
