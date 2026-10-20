import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	ListItemIcon,
	Menu,
	MenuItem,
	Tooltip,
	Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import LikeButton from "@/components/buttons/likeButton";
import LyricsPanel, {
	getLyricsQueryOptions,
} from "@/components/playback/audioPlayer/components/LyricsPanel";
import PlayerControls from "@/components/playback/audioPlayer/components/PlayerControls";
import PlayerProgress from "@/components/playback/audioPlayer/components/PlayerProgress";
import PlayerVolume from "@/components/playback/audioPlayer/components/PlayerVolume";
import StatsPanel from "@/components/playback/audioPlayer/components/StatsPanel";
import QueueView from "@/components/queue/queueView";
import { secToTicks, ticksToSec } from "@/utils/date/time";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { getItemQueryOptions } from "@/utils/queries/items";
import { useApiInContext } from "@/utils/store/api";
import {
	setIsMuted,
	setVolume,
	useAudioPlayback,
} from "@/utils/store/audioPlayback";
import { useCentralStore } from "@/utils/store/central";
import useQueue, {
	cycleRepeatMode,
	type RepeatMode,
	shuffleUpcoming,
} from "@/utils/store/queue";

import "./audio.scss";

export const Route = createFileRoute("/_api/player/audio")({
	component: AudioPlayerRoute,
});

const repeatLabels: Record<RepeatMode, string> = {
	off: "Repeat off",
	all: "Repeat all",
	one: "Repeat one",
};

/** Artists (linked) and album (linked) for the current track. */
const TrackSubtitle = ({ item }: { item: BaseItemDto }) => {
	const artists = item.ArtistItems?.length
		? item.ArtistItems
		: (item.AlbumArtists ?? []);
	return (
		<Typography
			variant="subtitle1"
			className="audio-now-playing-subtitle"
			noWrap
		>
			{artists.map((artist, index) => (
				<React.Fragment key={artist.Id ?? artist.Name}>
					{index > 0 && ", "}
					{artist.Id ? (
						<Link to="/music/artist/$id" params={{ id: artist.Id }}>
							{artist.Name}
						</Link>
					) : (
						artist.Name
					)}
				</React.Fragment>
			))}
			{item.Album && (
				<>
					{artists.length > 0 && " · "}
					{item.AlbumId ? (
						<Link to="/music/album/$id" params={{ id: item.AlbumId }}>
							{item.Album}
						</Link>
					) : (
						item.Album
					)}
				</>
			)}
		</Typography>
	);
};

function AudioPlayerRoute() {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const navigate = useNavigate();
	const [queue, currentTrack, repeatMode] = useQueue((s) => [
		s.tracks,
		s.currentItemIndex,
		s.repeatMode,
	]);
	const [item, audioPlayerRef, volume, isMuted] = useAudioPlayback((s) => [
		s.item,
		s.player.ref,
		s.player.volume,
		s.player.isMuted,
	]);

	const [progress, setProgress] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [statsOpen, setStatsOpen] = useState(false);

	useEffect(() => {
		const player = audioPlayerRef?.current;
		if (!player) return;

		const updateProgress = () => setProgress(player.currentTime);
		const updatePlaying = () => setPlaying(!player.paused);

		player.addEventListener("timeupdate", updateProgress);
		player.addEventListener("play", updatePlaying);
		player.addEventListener("pause", updatePlaying);

		setProgress(player.currentTime);
		setPlaying(!player.paused);

		return () => {
			player.removeEventListener("timeupdate", updateProgress);
			player.removeEventListener("play", updatePlaying);
			player.removeEventListener("pause", updatePlaying);
		};
	}, [audioPlayerRef?.current, item?.Id]);

	// Fresh user data so the like button reflects changes immediately.
	const itemDetails = useQuery({
		...getItemQueryOptions(item?.Id ?? "", api, user?.Id),
		enabled: Boolean(item?.Id && api && user?.Id),
	});
	const lyrics = useQuery(getLyricsQueryOptions(item, api));
	const hasLyrics = (lyrics.data?.Lyrics?.length ?? 0) > 0;

	const handlePlayPause = () => {
		const player = audioPlayerRef?.current;
		if (!player) return;
		if (player.paused) {
			player.play();
		} else {
			player.pause();
		}
	};

	const handleSeekCommit = (value: number) => {
		const player = audioPlayerRef?.current;
		if (player) {
			player.currentTime = ticksToSec(value);
			setProgress(ticksToSec(value));
		}
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

	const hasUpcoming = (queue?.length ?? 0) > currentTrack + 1;
	const isFavorite =
		itemDetails.data?.UserData?.IsFavorite ?? item?.UserData?.IsFavorite;
	const artistId = item?.ArtistItems?.[0]?.Id ?? item?.AlbumArtists?.[0]?.Id;

	return (
		<>
			<div className="audio-background">
				{imageUrl && (
					<img src={imageUrl} alt="" className="audio-background-image" />
				)}
			</div>
			<div className="audio-container">
				<section className="audio-now-playing" key={item?.Id}>
					<div className="audio-now-playing-art">
						{imageUrl ? (
							<img alt={item?.Name ?? "Album art"} src={imageUrl} />
						) : (
							<span className="material-symbols-rounded">music_note</span>
						)}
					</div>

					<div className="audio-now-playing-meta">
						<div className="audio-now-playing-text">
							<Typography
								variant="h5"
								sx={{
									fontWeight: 700,
									lineHeight: 1.2,
									overflowWrap: "anywhere",
								}}
							>
								{item?.Name}
							</Typography>
							{item && <TrackSubtitle item={item} />}
						</div>
						<LikeButton
							itemId={item?.Id ?? undefined}
							itemName={item?.Name}
							isFavorite={isFavorite}
							queryKey={["item", item?.Id ?? ""]}
							userId={user?.Id}
						/>
					</div>

					<PlayerProgress
						layout="stacked"
						progress={secToTicks(progress)}
						duration={item?.RunTimeTicks ?? 1}
						onSeek={(value) => setProgress(ticksToSec(value))}
						onSeekCommit={handleSeekCommit}
					/>

					<div className="audio-now-playing-transport">
						<Tooltip title="Shuffle upcoming">
							<span>
								<IconButton
									onClick={shuffleUpcoming}
									disabled={!hasUpcoming}
									aria-label="Shuffle upcoming"
								>
									<span className="material-symbols-rounded">shuffle</span>
								</IconButton>
							</span>
						</Tooltip>
						<PlayerControls
							playing={playing}
							onPlayPause={handlePlayPause}
							size="large"
						/>
						<Tooltip title={repeatLabels[repeatMode]}>
							<IconButton
								onClick={cycleRepeatMode}
								aria-label={repeatLabels[repeatMode]}
								className={repeatMode !== "off" ? "is-active" : undefined}
							>
								<span className="material-symbols-rounded">
									{repeatMode === "one" ? "repeat_one" : "repeat"}
								</span>
							</IconButton>
						</Tooltip>
					</div>

					<div className="audio-now-playing-utility">
						<div className="audio-now-playing-volume">
							<PlayerVolume
								volume={volume}
								isMuted={isMuted}
								onVolumeChange={setVolume}
								onMuteToggle={() => setIsMuted(!isMuted)}
							/>
						</div>
						<IconButton
							onClick={(e) => setMenuAnchor(e.currentTarget)}
							aria-label="More options"
						>
							<span className="material-symbols-rounded">more_horiz</span>
						</IconButton>
						<Menu
							anchorEl={menuAnchor}
							open={Boolean(menuAnchor)}
							onClose={() => setMenuAnchor(null)}
							anchorOrigin={{ vertical: "top", horizontal: "right" }}
							transformOrigin={{ vertical: "bottom", horizontal: "right" }}
						>
							<MenuItem
								disabled={!item?.AlbumId}
								onClick={() => {
									setMenuAnchor(null);
									if (item?.AlbumId) {
										navigate({
											to: "/music/album/$id",
											params: { id: item.AlbumId },
										});
									}
								}}
							>
								<ListItemIcon>
									<span className="material-symbols-rounded">album</span>
								</ListItemIcon>
								Go to album
							</MenuItem>
							<MenuItem
								disabled={!artistId}
								onClick={() => {
									setMenuAnchor(null);
									if (artistId) {
										navigate({
											to: "/music/artist/$id",
											params: { id: artistId },
										});
									}
								}}
							>
								<ListItemIcon>
									<span className="material-symbols-rounded">person</span>
								</ListItemIcon>
								Go to artist
							</MenuItem>
							<MenuItem
								onClick={() => {
									setMenuAnchor(null);
									setStatsOpen(true);
								}}
							>
								<ListItemIcon>
									<span className="material-symbols-rounded">query_stats</span>
								</ListItemIcon>
								Stats for nerds
							</MenuItem>
						</Menu>
					</div>
				</section>

				<aside
					className={`audio-side ${hasLyrics ? "has-lyrics" : ""}`}
					aria-label="Lyrics and queue"
				>
					{hasLyrics && (
						<div className="audio-side-lyrics">
							<LyricsPanel
								item={item}
								api={api}
								currentTime={progress}
								onSeek={handleSeekCommit}
							/>
						</div>
					)}
					<div className="audio-side-queue">
						<QueueView variant="panel" />
					</div>
				</aside>
			</div>

			<Dialog
				open={statsOpen}
				onClose={() => setStatsOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Stats for nerds</DialogTitle>
				<DialogContent>
					<StatsPanel item={item} audioRef={audioPlayerRef} />
				</DialogContent>
			</Dialog>
		</>
	);
}
