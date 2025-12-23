import { Box, Button, IconButton, Typography } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
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

	const [isHidden, setIsHidden] = useState(false);

	useEffect(() => {
		setIsHidden(false);
	}, [activeSegmentId]);

	const areControlsVisible = useMemo(() => {
		return isUserHovering || isUserSeeking || !isPlayerPlaying;
	}, [isUserHovering, isUserSeeking, isPlayerPlaying]);

	const api = useApiInContext((s) => s.api);

	if (
		!api ||
		!activeSegmentId ||
		mediaSegments?.Items?.[currentSegmemtIndex].Type !== "Outro" ||
		isHidden
	) {
		return null;
	}

	const item = tracks?.[nextItemIndex];
	if (!item || !item.Id) {
		return null;
	}

	return (
		<AnimatePresence>
			<motion.div
				className={
					areControlsVisible
						? "video-player-up_next_flyout floating"
						: "video-player-up_next_flyout"
				}
				initial={{ opacity: 0, y: 50, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 20, scale: 0.95 }}
				transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
				style={{
					background: "rgba(20, 20, 20, 0.6)",
					backdropFilter: "blur(16px) saturate(180%)",
					border: "1px solid rgba(255, 255, 255, 0.1)",
					boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
					borderRadius: "24px",
					padding: "16px",
					display: "flex",
					gap: "16px",
					maxWidth: "500px",
					width: "100%",
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						position: "relative",
						width: "160px",
						minWidth: "160px",
						borderRadius: "8px",
						overflow: "hidden",
						aspectRatio: "16/9",
						boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
					}}
				>
					<img
						src={getImageUrlsApi(api).getItemImageUrlById(item.Id, "Primary", {
							tag: item.ImageTags?.Primary,
							quality: 90,
							fillWidth: 320,
						})}
						alt="next item thumbnail"
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
						}}
					/>
					<Box
						sx={{
							position: "absolute",
							inset: 0,
							background:
								"linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
						}}
					/>
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						minWidth: 0,
						justifyContent: "center",
					}}
				>
					<Typography
						variant="overline"
						sx={{
							color: "primary.main",
							fontWeight: 700,
							lineHeight: 1,
							mb: 0.5,
							letterSpacing: 1.2,
						}}
					>
						UP NEXT
					</Typography>
					<Typography
						variant="h6"
						sx={{
							fontWeight: 600,
							lineHeight: 1.2,
							mb: 0.5,
							fontSize: "1.1rem",
						}}
						noWrap
					>
						{item.SeriesName || item.Name}
					</Typography>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{
							mb: 2,
							display: "-webkit-box",
							WebkitLineClamp: 1,
							WebkitBoxOrient: "vertical",
							overflow: "hidden",
							opacity: 0.8,
						}}
					>
						{item.SeriesName
							? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
							: item.Overview || ""}
					</Typography>

					<Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
						<Button
							onClick={skipSegment}
							variant="contained"
							color="primary"
							startIcon={
								<span className="material-symbols-rounded fill">
									play_arrow
								</span>
							}
							sx={{
								borderRadius: "8px",
								textTransform: "none",
								fontWeight: 600,
								boxShadow:
									"0 4px 12px rgba(var(--mui-palette-primary-mainChannel), 0.3)",
								flex: 1,
							}}
						>
							Play Now
						</Button>
						<IconButton
							onClick={() => setIsHidden(true)}
							sx={{
								borderRadius: "8px",
								border: "1px solid rgba(255,255,255,0.1)",
								color: "text.secondary",
								"&:hover": {
									bgcolor: "rgba(255,255,255,0.1)",
									color: "white",
								},
							}}
						>
							<span className="material-symbols-rounded">close</span>
						</IconButton>
					</Box>
				</Box>
			</motion.div>
		</AnimatePresence>
	);
};

export default UpNextFlyout;
