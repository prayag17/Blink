import { LinearProgress } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

const VolumeChangeOverlay = () => {
	const { playerVolume, showVolumeIndicator } = usePlaybackStore(
		useShallow((state) => ({
			playerVolume: state.playerState.volume,
			showVolumeIndicator: state.isVolumeInidcatorVisible,
		})),
	);
	return (
		<AnimatePresence>
			{showVolumeIndicator && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="video-volume-indicator glass"
				>
					<div className="material-symbols-rounded">
						{playerVolume > 0.7 ? "volume_up" : "volume_down"}
					</div>
					<LinearProgress
						style={{ width: "100%" }}
						value={playerVolume * 100}
						variant="determinate"
					/>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
export default VolumeChangeOverlay;
