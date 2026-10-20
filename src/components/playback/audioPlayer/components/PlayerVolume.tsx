import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import React from "react";

interface PlayerVolumeProps {
	volume: number;
	isMuted: boolean;
	onVolumeChange: (value: number) => void;
	onMuteToggle: () => void;
}

const PlayerVolume = ({
	volume,
	isMuted,
	onVolumeChange,
	onMuteToggle,
}: PlayerVolumeProps) => {
	const [localVolume, setLocalVolume] = React.useState(volume * 100);

	React.useEffect(() => {
		setLocalVolume(volume * 100);
	}, [volume]);

	return (
		<>
			<IconButton onClick={onMuteToggle}>
				<div className="material-symbols-rounded">
					{isMuted ? "volume_mute" : "volume_up"}
				</div>
			</IconButton>
			<Slider
				value={isMuted ? 0 : localVolume}
				step={1}
				max={100}
				onChange={(_, newVal) => {
					const newVolume = Array.isArray(newVal) ? newVal[0] : newVal;
					setLocalVolume(newVolume);
					onVolumeChange(newVolume / 100);
				}}
				valueLabelDisplay="auto"
				valueLabelFormat={(value) => Math.floor(value)}
				size="small"
				sx={{
					mr: 1,
					ml: 1,
					width: "10em",
					"& .MuiSlider-valueLabel": {
						// Compact pill hugging the thumb; above the play FAB (zIndex.fab)
						zIndex: (theme) => theme.zIndex.tooltip,
						lineHeight: 1.2,
						fontSize: "0.75rem",
						fontWeight: 600,
						fontVariantNumeric: "tabular-nums",
						minWidth: "2.25em",
						background: "rgb(0 0 0 / 0.75)",
						padding: "2px 6px",
						borderRadius: "6px",
						border: "1px solid rgb(255 255 255 / 0.15)",
						boxShadow: "0 2px 8px rgb(0 0 0 / 0.4)",
						top: -6,
						transform: "translatey(-100%) scale(0)",
						"&:before": {
							display: "none",
						},
						"&.MuiSlider-valueLabelOpen": {
							transform: "translateY(-100%) scale(1)",
						},
						"& > *": {
							transform: "rotate(0deg)",
						},
					},
				}}
			/>
		</>
	);
};

export default PlayerVolume;
