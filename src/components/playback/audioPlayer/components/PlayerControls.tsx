import Fab from "@mui/material/Fab";
import IconButton from "@mui/material/IconButton";
import React from "react";
import PlayNextButton from "@/components/buttons/playNextButton";
import PlayPreviousButton from "@/components/buttons/playPreviousButtom";

interface PlayerControlsProps {
	playing: boolean;
	onPlayPause: () => void;
	size?: "small" | "medium" | "large";
	onRewind?: () => void;
	onForward?: () => void;
}

const PlayerControls = ({
	playing,
	onPlayPause,
	size = "small",
	onRewind,
	onForward,
}: PlayerControlsProps) => {
	return (
		<div style={{ display: "flex", gap: "1em", alignItems: "center" }}>
			<PlayPreviousButton />
			{onRewind && (
				<IconButton onClick={onRewind}>
					<span className="material-symbols-rounded">fast_rewind</span>
				</IconButton>
			)}
			<div
				style={{
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
				}}
			>
				<Fab size={size} onClick={onPlayPause}>
					<div
						className="material-symbols-rounded"
						style={{
							fontSize: size === "large" ? "2.4em" : "2em",
						}}
					>
						{playing ? "pause" : "play_arrow"}
					</div>
				</Fab>
			</div>
			{onForward && (
				<IconButton onClick={onForward}>
					<span className="material-symbols-rounded">fast_forward</span>
				</IconButton>
			)}
			<PlayNextButton />
		</div>
	);
};

export default React.memo(PlayerControls);
