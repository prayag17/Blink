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
						lineHeight: 1.2,
						fontSize: 24,
						background: "rgb(0 0 0 / 0.5)",
						backdropFilter: "blur(5px)",
						padding: 1,
						borderRadius: "10px",
						border: "1px solid rgb(255 255 255 / 0.15)",
						boxShadow: "0 0 10px rgb(0 0 0 / 0.4) ",
						transform: "translatey(-120%) scale(0)",
						"&:before": {
							display: "none",
						},
						"&.MuiSlider-valueLabelOpen": {
							transform: "translateY(-120%) scale(1)",
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
