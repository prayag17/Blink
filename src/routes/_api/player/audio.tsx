import { Box, Tab, Tabs, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import { useApiInContext } from "@/utils/store/api";
import {
	setIsMuted,
	setVolume,
	useAudioPlayback,
} from "@/utils/store/audioPlayback";
import useQueue from "@/utils/store/queue";

import "./audio.scss";

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import LyricsPanel from "@/components/playback/audioPlayer/components/LyricsPanel";
import PlayerControls from "@/components/playback/audioPlayer/components/PlayerControls";
import PlayerProgress from "@/components/playback/audioPlayer/components/PlayerProgress";
import PlayerVolume from "@/components/playback/audioPlayer/components/PlayerVolume";
import QueuePanel from "@/components/playback/audioPlayer/components/QueuePanel";
import StatsPanel from "@/components/playback/audioPlayer/components/StatsPanel";
import { secToTicks, ticksToSec } from "@/utils/date/time";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";

export const Route = createFileRoute("/_api/player/audio")({
	component: AudioPlayerRoute,
});

const SEEK_AMOUNT = 10;

const AudioInfo = React.memo(
	({
		item,
		imageUrl,
	}: {
		item: BaseItemDto | undefined | null;
		imageUrl: string | undefined;
	}) => (
		<>
			<div className="audio-info-image-container">
				{imageUrl ? (
					<img
						alt={item?.Name ?? "Music"}
						src={imageUrl}
						className="audio-info-image"
					/>
				) : (
					<div className="audio-info-image-icon">
						<span
							className="material-symbols-rounded"
							style={{ fontSize: "inherit" }}
						>
							music_note
						</span>
					</div>
				)}
			</div>

			<div className="audio-info">
				<Typography
					variant="h4"
					fontWeight={700}
					noWrap
					style={{ width: "100%", marginBottom: "0.2em" }}
				>
					{item?.Name}
				</Typography>
				<Typography
					variant="h6"
					fontWeight={400}
					className="opacity-07"
					noWrap
					style={{ width: "100%" }}
				>
					{item?.Artists?.join(", ")}
				</Typography>
			</div>
		</>
	),
);

function AudioPlayerRoute() {
	const api = useApiInContext((s) => s.api);
	const [queue, currentTrack] = useQueue((s) => [s.tracks, s.currentItemIndex]);
	const [item, audioPlayerRef, volume, isMuted] = useAudioPlayback((s) => [
		s.item,
		s.player.ref,
		s.player.volume,
		s.player.isMuted,
	]);

	const [progress, setProgress] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [tabValue, setTabValue] = useState(0);

	useEffect(() => {
		const player = audioPlayerRef?.current;
		if (!player) return;

		const updateProgress = () => setProgress(player.currentTime);
		const updatePlaying = () => setPlaying(!player.paused);

		player.addEventListener("timeupdate", updateProgress);
		player.addEventListener("play", updatePlaying);
		player.addEventListener("pause", updatePlaying);

		// Initial state
		setProgress(player.currentTime);
		setPlaying(!player.paused);

		return () => {
			player.removeEventListener("timeupdate", updateProgress);
			player.removeEventListener("play", updatePlaying);
			player.removeEventListener("pause", updatePlaying);
		};
	}, [audioPlayerRef?.current, item?.Id]);

	const handlePlayPause = () => {
		const player = audioPlayerRef?.current;
		if (player) {
			if (player.paused) {
				player.play();
			} else {
				player.pause();
			}
		}
	};

	const handleSeek = (value: number) => {
		setProgress(ticksToSec(value));
	};

	const handleSeekCommit = (value: number) => {
		const player = audioPlayerRef?.current;
		if (player) {
			player.currentTime = ticksToSec(value);
			setProgress(ticksToSec(value));
		}
	};

	const handleRewind = () => {
		const player = audioPlayerRef?.current;
		if (player) {
			player.currentTime -= SEEK_AMOUNT;
		}
	};

	const handleForward = () => {
		const player = audioPlayerRef?.current;
		if (player) {
			player.currentTime += SEEK_AMOUNT;
		}
	};
	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	const imageUrl = useMemo(
		() =>
			item?.ImageTags?.Primary
				? api &&
					getImageUrlsApi(api).getItemImageUrlById(item.Id ?? "", "Primary", {
						tag: item.ImageTags.Primary,
					})
				: undefined,
		[item?.Id, item?.ImageTags?.Primary, api],
	);

	return (
		<>
			<div className="audio-background">
				{imageUrl && (
					<img src={imageUrl} alt="" className="audio-background-image" />
				)}
			</div>
			<div className="audio-container" key={item?.Id}>
				<div className="audio-left-column">
					<AudioInfo item={item} imageUrl={imageUrl} />

					<PlayerProgress
						progress={secToTicks(progress)}
						duration={item?.RunTimeTicks ?? 1}
						onSeek={handleSeek}
						onSeekCommit={handleSeekCommit}
					/>

					<div className="audio-info-controls">
						<PlayerControls
							playing={playing}
							onPlayPause={handlePlayPause}
							size="large"
							onRewind={handleRewind}
							onForward={handleForward}
						/>
					</div>

					<div
						className="audio-info-volume"
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "100%",
						}}
					>
						<PlayerVolume
							volume={volume}
							isMuted={isMuted}
							onVolumeChange={setVolume}
							onMuteToggle={() => setIsMuted(!isMuted)}
						/>
					</div>
				</div>

				<div className="audio-right-column">
					<Box sx={{ borderBottom: 1, borderColor: "rgba(255,255,255,0.1)" }}>
						<Tabs
							value={tabValue}
							onChange={handleTabChange}
							aria-label="audio player tabs"
							variant="fullWidth"
							scrollButtons="auto"
							allowScrollButtonsMobile
							textColor="inherit"
							indicatorColor="primary"
							sx={{
								"& .MuiTab-root": {
									color: "rgba(255,255,255,0.5)",
									"&.Mui-selected": { color: "white" },
								},
							}}
						>
							<Tab label="Queue" />
							<Tab label="Lyrics" />
							<Tab label="Stats" />
						</Tabs>
					</Box>

					<div className="audio-right-content">
						{tabValue === 0 && queue && (
							<QueuePanel queue={queue} currentTrackIndex={currentTrack} />
						)}
						{tabValue === 1 && (
							<LyricsPanel item={item} api={api} currentTime={progress} />
						)}
						{tabValue === 2 && (
							<StatsPanel item={item} audioRef={audioPlayerRef} />
						)}
					</div>
				</div>
			</div>
		</>
	);
}

