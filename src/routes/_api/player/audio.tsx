import { useApiInContext } from "@/utils/store/api";
import { useAudioPlayback } from "@/utils/store/audioPlayback";
import useQueue from "@/utils/store/queue";
import { Fab, IconButton, Slider, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import React, { useCallback, useEffect, useRef, useState } from "react";

import "./audio.scss";
import LikeButton from "@/components/buttons/likeButton";
import PlayNextButton from "@/components/buttons/playNextButton";
import PlayPreviousButton from "@/components/buttons/playPreviousButtom";
import QueueTrack from "@/components/queueTrack";
import { getRuntimeMusic, secToTicks, ticksToSec } from "@/utils/date/time";
import { useDrop } from "react-dnd";
import { Identifier } from "typescript";

export const Route = createFileRoute("/_api/player/audio")({
	component: AudioPlayerRoute,
});

const SEEK_AMOUNT = 10; // seconds to skip on fast_rewind or fast_forward button click

function AudioPlayerRoute() {
	const api = useApiInContext((s) => s.api);
	const [queue, currentTrack] = useQueue((s) => [s.tracks, s.currentItemIndex]);
	const [item] = useAudioPlayback((s) => [s.item]);
	const audioPlayer: HTMLAudioElement | null =
		document.querySelector("#audio-player");

	const [isScrubbing, setIsScrubbing] = useState(false);
	const [sliderProgress, setSliderProgress] = useState<number | number[]>(0); // this state hold the slider scrubbing value allowing user to scrub track without changing current time
	const [progress, setProgress] = useState<number | number[]>(
		audioPlayer?.currentTime ?? 0,
	);
	useEffect(() => {
		audioPlayer?.addEventListener("timeupdate", () => {
			setProgress(audioPlayer.currentTime);
		});
	}, [item?.Id]);

	return (
		<div className="scrollY padded-top flex flex-column" style={{ gap: "1em" }}>
			<div className="audio-info-container">
				<div className="audio-info-image-container">
					{item?.ImageTags ? (
						<img
							alt={item.Name ?? "Music"}
							src={api.getItemImageUrl(item.Id, "Primary", {
								tag: item.ImageTags.Primary,
							})}
							className="audio-info-image"
						/>
					) : (
						<span className="material-symbols-rounded fill">music_note</span>
					)}
				</div>
				<div className="audio-info">
					<Typography variant="h4" fontWeight={400}>
						{item?.Name}
					</Typography>
					<Typography
						variant="subtitle1"
						fontWeight={300}
						className="opacity-07"
					>
						by {item?.Artists?.join(", ")}
					</Typography>
					<Slider
						style={{
							marginTop: "1.2em",
						}}
						value={isScrubbing ? sliderProgress : secToTicks(progress)}
						max={item?.RunTimeTicks ?? 1}
						step={1}
						onChange={(_, newVal) => {
							setIsScrubbing(true);
							setSliderProgress(newVal);
						}}
						onChangeCommitted={(_, newVal) => {
							setIsScrubbing(false);
							Array.isArray(newVal)
								? setProgress(ticksToSec(newVal[0]))
								: setProgress(ticksToSec(newVal));
							audioPlayer?.currentTime = Array.isArray(newVal)
								? ticksToSec(newVal[0])
								: ticksToSec(newVal);
						}}
						sx={{
							"& .MuiSlider-thumb": {
								width: 14,
								height: 14,
								transition: "0.1s ease-in-out",
								opacity: 0,
								"&.Mui-active": {
									width: 20,
									height: 20,
									opacity: 1,
								},
							},
							"&:hover .MuiSlider-thumb": {
								opacity: 1,
							},
							"& .MuiSlider-rail": {
								opacity: 0.28,
								background: "white",
							},
						}}
					/>
					<div className="audio-info-controls">
						<PlayPreviousButton />
						<IconButton
							onClick={() => {
								audioPlayer?.currentTime -= SEEK_AMOUNT;
							}}
						>
							<span className="material-symbols-rounded">fast_rewind</span>
						</IconButton>
						<Fab
							color="white"
							size="large"
							onClick={() =>
								audioPlayer?.paused ? audioPlayer.play() : audioPlayer?.pause()
							}
						>
							<span
								className="fill material-symbols-rounded"
								style={{
									fontSize: "2.4em",
								}}
							>
								{audioPlayer?.paused ? "play_arrow" : "pause"}
							</span>
						</Fab>
						<IconButton
							onClick={() => {
								audioPlayer?.currentTime += SEEK_AMOUNT;
							}}
						>
							<span className="material-symbols-rounded">fast_forward</span>
						</IconButton>
						<PlayNextButton />
					</div>
				</div>
			</div>
			<div className="audio-queue-container">
				<Typography variant="h5">Queue:</Typography>
				<div className="audio-queue">
					{queue.map((track, index) => (
						<QueueTrack key={track.Id} track={track} index={index} />
					))}
				</div>
			</div>
		</div>
	);
}