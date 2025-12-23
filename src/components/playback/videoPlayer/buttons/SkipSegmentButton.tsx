import { Box, Button } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
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

	const shouldShow =
		mediaSegments?.Items?.length &&
		currentSegmentIndex >= 0 &&
		activeSegmentId &&
		mediaSegments?.Items?.[currentSegmentIndex].Type !== "Outro";

	return (
		<AnimatePresence>
			{shouldShow && (
				<motion.div
					initial={{ opacity: 0, x: 20, scale: 0.9 }}
					animate={{ opacity: 1, x: 0, scale: 1 }}
					exit={{ opacity: 0, x: 20, scale: 0.9 }}
					transition={{
						type: "spring",
						stiffness: 300,
						damping: 30,
					}}
					style={{
						position: "absolute",
						right: "3em",
						zIndex: 10000,
						bottom:
							isUserHovering || !isPlayerPlaying || isUserSeeking ? "20vh" : "6em",
						transition: "bottom 0.3s ease-in-out",
					}}
				>
					<Button
						onClick={skipSegment}
						variant="contained"
						startIcon={
							<span className="material-symbols-rounded">skip_next</span>
						}
						sx={{
							bgcolor: "rgba(20, 20, 20, 0.6)",
							backdropFilter: "blur(16px) saturate(180%)",
							color: "white",
							border: "1px solid rgba(255, 255, 255, 0.1)",
							borderRadius: "12px",
							padding: "12px 24px",
							textTransform: "none",
							fontSize: "1rem",
							fontWeight: 600,
							boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
							transition: "all 0.2s ease",
							"&:hover": {
								bgcolor: "rgba(255, 255, 255, 0.1)",
								transform: "scale(1.02)",
								boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
								border: "1px solid rgba(255, 255, 255, 0.2)",
							},
							"&:active": {
								transform: "scale(0.98)",
							},
						}}
					>
						Skip {mediaSegments?.Items?.[currentSegmentIndex].Type}
					</Button>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

const SkipSegmentButtonMemo = React.memo(SkipSegmentButton);

export default SkipSegmentButtonMemo;
