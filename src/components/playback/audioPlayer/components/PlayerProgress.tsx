import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { getRuntimeMusic } from "@/utils/date/time";

interface PlayerProgressProps {
	progress: number;
	duration: number;
	onSeek: (value: number) => void;
	onSeekCommit: (value: number) => void;
}

const PlayerProgress = ({
	progress,
	duration,
	onSeek,
	onSeekCommit,
}: PlayerProgressProps) => {
	const [isScrubbing, setIsScrubbing] = useState(false);
	const [sliderValue, setSliderValue] = useState(progress);

	useEffect(() => {
		if (!isScrubbing) {
			setSliderValue(progress);
		}
	}, [progress, isScrubbing]);

	const handleChange = (_: Event, value: number | number[]) => {
		setIsScrubbing(true);
		const newValue = Array.isArray(value) ? value[0] : value;
		setSliderValue(newValue);
		onSeek(newValue);
	};

	const handleChangeCommitted = (_: unknown, value: number | number[]) => {
		setIsScrubbing(false);
		const newValue = Array.isArray(value) ? value[0] : value;
		onSeekCommit(newValue);
	};

	return (
		<div
			style={{
				width: "100%",
				display: "flex",
				gap: "1em",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Typography
				variant="subtitle2"
				fontWeight={300}
				style={{
					opacity: 0.8,
					minWidth: "3.5em",
					textAlign: "right",
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{getRuntimeMusic(sliderValue)}
			</Typography>
			<Slider
				value={sliderValue}
				step={1}
				size="small"
				max={duration}
				onChange={handleChange}
				onChangeCommitted={handleChangeCommitted}
			/>
			<Typography
				variant="subtitle2"
				fontWeight={300}
				style={{
					opacity: 0.8,
					minWidth: "3.5em",
					textAlign: "left",
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{getRuntimeMusic(duration)}
			</Typography>
		</div>
	);
};

export default PlayerProgress;
