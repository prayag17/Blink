import type { Api } from "@jellyfin/sdk";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { getLyricApi } from "@jellyfin/sdk/lib/utils/api/lyric-api";
import { Typography } from "@mui/material";
import { queryOptions, useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { secToTicks } from "@/utils/date/time";

export const getLyricsQueryOptions = (
	item: BaseItemDto | undefined | null,
	api: Api | undefined,
) =>
	queryOptions({
		queryKey: ["player", "audio", item?.Id, "lyrics"],
		queryFn: async () => {
			if (!item?.Id || !api) {
				return null;
			}
			try {
				const response = await getLyricApi(api).getLyrics({
					itemId: item.Id,
				});
				return response.data;
			} catch {
				// Items without lyrics return 404
				return null;
			}
		},
		enabled: Boolean(item?.Id) && Boolean(api),
	});

interface LyricsPanelProps {
	item: BaseItemDto | undefined | null;
	api: Api | undefined;
	currentTime: number;
	/** Seeks playback to a position in ticks; enables clicking synced lines. */
	onSeek?: (ticks: number) => void;
}

const LyricsPanel = ({ item, api, currentTime, onSeek }: LyricsPanelProps) => {
	const lyricsContainer = useRef<HTMLDivElement | null>(null);

	const lyrics = useQuery(getLyricsQueryOptions(item, api));

	useEffect(() => {
		if (lyrics.data && lyricsContainer.current) {
			const currentLyric = lyricsContainer.current.querySelector(
				"[data-active-lyric='true']",
			);
			if (currentLyric) {
				currentLyric.scrollIntoView({
					block: "center",
					inline: "nearest",
					behavior: "smooth",
				});
			}
		}
	}, [currentTime, lyrics.data]);

	if (lyrics.isLoading) {
		return (
			<div className="audio-lyrics-status">
				<Typography>Loading lyrics...</Typography>
			</div>
		);
	}

	if (lyrics.isError || !lyrics.data || !lyrics.data.Lyrics?.length) {
		return (
			<div className="audio-lyrics-status">
				<Typography>No lyrics available</Typography>
			</div>
		);
	}

	const hasSyncedLyrics = (lyrics.data.Lyrics[0].Start ?? -1) >= 0;

	return (
		<div className="audio-lyrics" data-has-synced-lyrics={hasSyncedLyrics}>
			<div className="audio-lyrics-container" ref={lyricsContainer}>
				{lyrics.data.Lyrics.map((lyric, index) => {
					const isActive =
						hasSyncedLyrics &&
						secToTicks(currentTime) >= (lyric.Start ?? 0) &&
						secToTicks(currentTime) <
							(lyrics.data?.Lyrics?.[index + 1]?.Start ??
								Number.POSITIVE_INFINITY);

					const canSeek = hasSyncedLyrics && onSeek && lyric.Start != null;
					const seek = () => {
						if (canSeek) onSeek(lyric.Start ?? 0);
					};

					return (
						<Typography
							variant="body1"
							component="p"
							className={`audio-lyrics-line ${isActive ? "active" : ""}`}
							key={`${lyric.Text}-${index}`}
							data-active-lyric={isActive}
							{...(canSeek && {
								role: "button",
								tabIndex: 0,
								"data-seekable": true,
								onClick: seek,
								onKeyDown: (e: React.KeyboardEvent) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										seek();
									}
								},
							})}
						>
							{lyric.Text}
						</Typography>
					);
				})}
			</div>
			{!hasSyncedLyrics && (
				<div className="audio-lyrics-unsynced-notice">
					<span className="material-symbols-rounded">info</span>
					<Typography variant="caption">Synced lyrics not available</Typography>
				</div>
			)}
		</div>
	);
};

export default React.memo(LyricsPanel);
