import { useApiInContext } from "@/utils/store/api";
import { useAudioPlayback } from "@/utils/store/audioPlayback";
import useQueue, { setQueue } from "@/utils/store/queue";
import { Fab, IconButton, Slider, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";

import "./audio.scss";
import PlayNextButton from "@/components/buttons/playNextButton";
import PlayPreviousButton from "@/components/buttons/playPreviousButtom";
import QueueTrack from "@/components/queueTrack";
import { getRuntimeMusic, secToTicks, ticksToSec } from "@/utils/date/time";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { getLyricsApi } from "@jellyfin/sdk/lib/utils/api/lyrics-api";
import { useQuery } from "@tanstack/react-query";

import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	restrictToVerticalAxis,
	restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export const Route = createFileRoute("/_api/player/audio")({
	component: AudioPlayerRoute,
});

const SEEK_AMOUNT = 10; // seconds to skip on fast_rewind or fast_forward button click

function AudioPlayerRoute() {
	const api = useApiInContext((s) => s.api);
	const [queue, currentTrack] = useQueue((s) => [s.tracks, s.currentItemIndex]);
	const [item, audioPlayerRef] = useAudioPlayback((s) => [
		s.item,
		s.player.ref,
	]);
	const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(
		audioPlayerRef?.current ? audioPlayerRef?.current : null,
	);
	useEffect(() => {
		if (audioPlayerRef?.current) {
			setAudioPlayer(audioPlayerRef?.current);
		}
	}, [audioPlayerRef?.current]);

	console.log(audioPlayer?.paused);

	const [isScrubbing, setIsScrubbing] = useState(false);
	const [sliderProgress, setSliderProgress] = useState<number | number[]>(0); // this state hold the slider scrubbing value allowing user to scrub track without changing current time
	const [progress, setProgress] = useState<number | number[]>(
		audioPlayer?.currentTime ?? 0,
	);

	const [showLyrics, setShowLyrics] = useState(false);

	const lyrics = useQuery({
		queryKey: ["player", "audio", item?.Id, "lyrics"],
		queryFn: async () => {
			if (!item?.Id || !api) {
				return null;
			}
			return (
				await getLyricsApi(api).getLyrics({
					itemId: item?.Id,
				})
			).data;
		},
		enabled: Boolean(item?.Id),
	});

	useEffect(() => {
		audioPlayerRef?.current?.addEventListener("timeupdate", () => {
			setProgress(audioPlayerRef?.current?.currentTime ?? 0);
		});
		return () => {
			audioPlayerRef?.current?.removeEventListener("timeupdate", () => {
				setProgress(audioPlayerRef?.current?.currentTime ?? 0);
			});
		};
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

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (active.id !== over?.id) {
			const prevState = queue;
			const oldIndex = prevState
				?.map((item) => item.Id)
				.indexOf(String(active.id));
			const newIndex = prevState
				?.map((item) => item.Id)
				.indexOf(String(over?.id));

			if (oldIndex === newIndex) {
				return;
			}
			if (!oldIndex || !newIndex) {
				return;
			}
			if (oldIndex === -1 || newIndex === -1) {
				return;
			}
			const newState = prevState
				? arrayMove(prevState, oldIndex, newIndex)
				: prevState;

			const currentTrack = newState?.map((item) => item.Id).indexOf(item?.Id);

			if (!currentTrack) {
				return;
			}
			setQueue(newState, currentTrack);
			// setQueue(newState);
		}
	};

	const [currentDraggingIndex, setCurrentDraggingIndex] = useState<
		number | null
	>(null);

	return (
		<div
			className="scrollY padded-top flex flex-column"
			style={{ gap: "1em" }}
			key={item?.Id}
		>
			<div className="audio-info-container">
				<div className="audio-info-image-container">
					{item?.ImageTags?.Primary ? (
						<img
							alt={item.Name ?? "Music"}
							src={
								api &&
								getImageUrlsApi(api).getItemImageUrlById(
									item.Id ?? "",
									"Primary",
									{
										tag: item.ImageTags.Primary,
									},
								)
							}
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
							{getRuntimeMusic(secToTicks(audioPlayer?.currentTime ?? 0) ?? 0)}
						</Typography>
						<Slider
							value={
								isScrubbing ? sliderProgress : secToTicks(Number(progress))
							}
							max={item?.RunTimeTicks ?? 1}
							step={1}
							key={item?.Id}
							onChange={(_, newVal) => {
								setIsScrubbing(true);
								setSliderProgress(newVal);
							}}
							onChangeCommitted={(_, newVal) => {
								setIsScrubbing(false);
								Array.isArray(newVal)
									? setProgress(ticksToSec(newVal[0]))
									: setProgress(ticksToSec(newVal));
								if (audioPlayerRef?.current) {
									audioPlayerRef.current.currentTime = Array.isArray(newVal)
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
								disabled={!audioPlayerRef?.current?.readyState}
								//@ts-ignore
								color="white"
								size="large"
								onClick={() =>
									audioPlayerRef?.current?.paused
										? audioPlayerRef?.current?.play()
										: audioPlayerRef?.current?.pause()
								}
							>
								<span
									className="fill material-symbols-rounded"
									style={{
										fontSize: "2.4em",
									}}
								>
									{audioPlayerRef?.current?.paused ? "play_arrow" : "pause"}
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
						(lyrics.data?.Lyrics?.[0].Start ?? -1) >= 0,
					)}
				>
					<div className="audio-lyrics-container" ref={lyricsContainer}>
						{lyrics.data?.Lyrics?.map((lyric, index) => (
							<div
								className="audio-lyrics-line"
								key={`${lyric.Text}${index}`}
								data-active-lyric={
									secToTicks(audioPlayer?.currentTime ?? 0) >=
										(lyric.Start ?? 0) &&
									secToTicks(audioPlayer?.currentTime ?? 0) <
										(lyrics.data?.Lyrics?.[index + 1]?.Start ?? 0)
								}
							>
								{lyric.Text}
							</div>
						))}
					</div>
					{!((lyrics.data?.Lyrics?.[0].Start ?? -1) >= 0) && (
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
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
				onDragStart={(event) => {
					const { active } = event;
					setCurrentDraggingIndex(
						queue?.map((item) => item.Id).indexOf(String(active.id) ?? "") ?? 0,
					);
				}}
				modifiers={[restrictToVerticalAxis]}
			>
				{queue && (
					<div className="audio-queue-container">
						<Typography variant="h5">Queue:</Typography>
						<SortableContext
							//@ts-ignore
							items={queue?.map((track) => track.Id)}
							strategy={verticalListSortingStrategy}
						>
							<div className="audio-queue">
								{queue?.map((track, index) => (
									<QueueTrack key={track.Id} track={track} index={index} />
								))}
							</div>
						</SortableContext>
						<DragOverlay modifiers={[restrictToWindowEdges]}>
							{(currentDraggingIndex ?? -1) >= 0 && (
								<div className="audio-queue-track dragging">
									<span className="material-symbols-rounded">drag_handle</span>
									<div className="audio-queue-track-info">
										<Typography className="audio-queue-track-info-name">
											{queue[currentDraggingIndex ?? 0].Name}
										</Typography>
										<Typography
											fontWeight={300}
											className="opacity-07"
											variant="subtitle2"
										>
											{queue[currentDraggingIndex ?? 0].Artists?.join(", ")}
										</Typography>
									</div>
									<Typography className="opacity-07">
										{getRuntimeMusic(
											queue[currentDraggingIndex ?? 0].RunTimeTicks ?? 0,
										)}
									</Typography>
								</div>
							)}
						</DragOverlay>
					</div>
				)}
			</DndContext>
		</div>
	);
}