import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { getRuntimeMusic } from "@/utils/date/time";

interface PlayerProgressProps {
	progress: number;
	duration: number;
	onSeek?: (value: number) => void;
	onSeekCommit: (value: number) => void;
	/**
	 * "inline" puts the times beside the bar, "stacked" puts them underneath,
	 * "bare" renders only the slider.
	 */
	layout?: "inline" | "stacked" | "bare";
	className?: string;
}

const PlayerProgress = ({
	progress,
	duration,
	onSeek,
	onSeekCommit,
	layout = "inline",
	className,
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
		onSeek?.(newValue);
	};

	const handleChangeCommitted = (_: unknown, value: number | number[]) => {
		setIsScrubbing(false);
		const newValue = Array.isArray(value) ? value[0] : value;
		onSeekCommit(newValue);
	};

	if (layout === "bare") {
		return (
			<Slider
				className={className}
				value={sliderValue}
				step={1}
				size="small"
				max={duration}
				onChange={handleChange}
				onChangeCommitted={handleChangeCommitted}
				aria-label="Seek"
			/>
		);
	}

	if (layout === "stacked") {
		return (
			<div className="player-progress-stacked">
				<Slider
					value={sliderValue}
					step={1}
					size="small"
					max={duration}
					onChange={handleChange}
					onChangeCommitted={handleChangeCommitted}
					aria-label="Seek"
				/>
				<div className="player-progress-stacked-times">
					<span>{getRuntimeMusic(sliderValue)}</span>
					<span>-{getRuntimeMusic(Math.max(duration - sliderValue, 0))}</span>
				</div>
			</div>
		);
	}

	return (
		<div
			className={className}
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
				style={{
					opacity: 0.8,
					minWidth: "3.5em",
					textAlign: "right",
					fontVariantNumeric: "tabular-nums",
				}}
				sx={{
					fontWeight: 300,
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
				style={{
					opacity: 0.8,
					minWidth: "3.5em",
					textAlign: "left",
					fontVariantNumeric: "tabular-nums",
				}}
				sx={{
					fontWeight: 300,
				}}
			>
				{getRuntimeMusic(duration)}
			</Typography>
		</div>
	);
};

export default PlayerProgress;
