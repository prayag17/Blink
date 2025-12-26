import type { Api } from "@jellyfin/sdk";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { getLyricsApi } from "@jellyfin/sdk/lib/utils/api/lyrics-api";
import { Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { secToTicks } from "@/utils/date/time";

interface LyricsPanelProps {
	item: BaseItemDto | undefined | null;
	api: Api | undefined;
	currentTime: number;
}

const LyricsPanel = ({ item, api, currentTime }: LyricsPanelProps) => {
	const lyricsContainer = useRef<HTMLDivElement | null>(null);

	const lyrics = useQuery({
		queryKey: ["player", "audio", item?.Id, "lyrics"],
		queryFn: async () => {
			if (!item?.Id || !api) {
				return null;
			}
			try {
				const response = await getLyricsApi(api).getLyrics({
					itemId: item?.Id,
				});
				return response.data;
			} catch (e) {
				console.error("Failed to fetch lyrics", e);
				return null;
			}
		},
		enabled: Boolean(item?.Id) && Boolean(api),
	});

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

					return (
						<Typography
							variant="body1"
							component="p"
							className={`audio-lyrics-line ${isActive ? "active" : ""}`}
							key={`${lyric.Text}-${index}`}
							data-active-lyric={isActive}
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
