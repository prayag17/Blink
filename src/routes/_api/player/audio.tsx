import { useApiInContext } from "@/utils/store/api";
import { useAudioPlayback } from "@/utils/store/audioPlayback";
import useQueue from "@/utils/store/queue";
import { Fab, IconButton, Slider, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import "./audio.scss";
import LikeButton from "@/components/buttons/likeButton";
import PlayNextButton from "@/components/buttons/playNextButton";
import PlayPreviousButton from "@/components/buttons/playPreviousButtom";
import QueueTrack from "@/components/queueTrack";
import { getRuntimeMusic, secToTicks, ticksToSec } from "@/utils/date/time";
import { getLyricsApi } from "@jellyfin/sdk/lib/utils/api/lyrics-api";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_api/player/audio")({
	component: AudioPlayerRoute,
});

const SEEK_AMOUNT = 10; // seconds to skip on fast_rewind or fast_forward button click

function AudioPlayerRoute() {
	const api = useApiInContext((s) => s.api);
	const [queue, currentTrack] = useQueue((s) => [s.tracks, s.currentItemIndex]);
	const [item] = useAudioPlayback((s) => [s.item]);
	const audioPlayer: HTMLAudioElement | null = useMemo(
		() => document.querySelector("#audio-player"),
		[item],
	);

	const [isScrubbing, setIsScrubbing] = useState(false);
	const [sliderProgress, setSliderProgress] = useState<number | number[]>(0); // this state hold the slider scrubbing value allowing user to scrub track without changing current time
	const [progress, setProgress] = useState<number | number[]>(
		audioPlayer?.currentTime ?? 0,
	);

	const [showLyrics, setShowLyrics] = useState(false);

	const lyrics = useQuery({
		queryKey: ["player", "audio", item?.Id, "lyrics"],
		queryFn: async () =>
			(
				await getLyricsApi(api).searchRemoteLyrics({
					itemId: item?.Id,
				})
			).data,
		enabled: Boolean(item?.Id),
	});

	useEffect(() => {
		audioPlayer?.addEventListener("timeupdate", () => {
			setProgress(audioPlayer.currentTime ?? 0);
		});
		console.log(audioPlayer);
	}, [item?.Id, currentTrack]);

	const lyricsContainer = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (showLyrics) {
			const currentLyric = document.querySelector("[data-active-lyric='true']");
			currentLyric?.scrollIntoView({
				block: "nearest",
				inline: "nearest",
				behavior: "smooth",
			});
		}
	}, [showLyrics, audioPlayer?.currentTime]);

	return (
		<div
			className="scrollY padded-top flex flex-column"
			style={{ gap: "1em" }}
			key={queue[currentTrack]?.Id}
		>
			<div className="audio-info-container">
				<div className="audio-info-image-container">
					{item?.ImageTags?.Primary ? (
						<img
							alt={item.Name ?? "Music"}
							src={api.getItemImageUrl(item.Id, "Primary", {
								tag: item.ImageTags.Primary,
							})}
							className="audio-info-image"
						/>
					) : (
						<span className="material-symbols-rounded fill audio-info-image-icon">
							music_note
						</span>
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
					<div
						className="flex flex-row"
						style={{ gap: "1em", alignItems: "center" }}
					>
						<Typography variant="subtitle2" className="opacity-07">
							{getRuntimeMusic(secToTicks(audioPlayer?.currentTime) ?? 0)}
						</Typography>
						<Slider
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
								if (audioPlayer) {
									audioPlayer.currentTime = Array.isArray(newVal)
										? ticksToSec(newVal[0])
										: ticksToSec(newVal);
								}
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
						<Typography variant="subtitle2" className="opacity-07">
							{getRuntimeMusic(item?.RunTimeTicks ?? 0)}
						</Typography>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "100%",
						}}
					>
						<div className="audio-info-controls">
							<PlayPreviousButton />
							<IconButton
								onClick={() => {
									if (audioPlayer) {
										audioPlayer.currentTime -= SEEK_AMOUNT;
									}
								}}
							>
								<span className="material-symbols-rounded">fast_rewind</span>
							</IconButton>
							<Fab
								disabled={!audioPlayer?.readyState}
								color="white"
								size="large"
								onClick={() =>
									audioPlayer?.paused
										? audioPlayer.play()
										: audioPlayer?.pause()
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
									if (audioPlayer) {
										audioPlayer.currentTime += SEEK_AMOUNT;
									}
								}}
							>
								<span className="material-symbols-rounded">fast_forward</span>
							</IconButton>
							<PlayNextButton />
						</div>
						<IconButton onClick={() => setShowLyrics((s) => !s)}>
							<span
								className={
									showLyrics
										? "material-symbols-rounded fill"
										: "material-symbols-rounded"
								}
							>
								lyrics
							</span>
						</IconButton>
					</div>
				</div>
			</div>
			{showLyrics && (
				<div
					className="audio-lyrics"
					data-has-synced-lyrics={Boolean(
						lyrics.data?.[0]?.Lyrics?.Metadata?.IsSynced,
					)}
				>
					<div className="audio-lyrics-container" ref={lyricsContainer}>
						{lyrics.data?.[1]?.Lyrics?.Lyrics?.map((lyric, index) => (
							<div
								className="audio-lyrics-line"
								key={`${lyric.Text}${index}`}
								data-active-lyric={
									secToTicks(audioPlayer?.currentTime) >= lyric.Start &&
									secToTicks(audioPlayer?.currentTime) <
										(lyrics.data?.[0]?.Lyrics?.Lyrics?.[index + 1]?.Start ?? 0)
								}
							>
								{lyric.Text}
							</div>
						))}
					</div>
					{!lyrics.data?.[0]?.Lyrics?.Metadata?.IsSynced && (
						<Typography
							className="flex flex-align-center"
							style={{
								position: "absolute",
								bottom: "-2em",
								opacity: 0.7,
								gap: "0.4em",
							}}
						>
							<span className="material-symbols-rounded">info</span>
							Synced subtitles no available
						</Typography>
					)}
				</div>
			)}
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