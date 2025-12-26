import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { Box, Paper, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";

interface StatsPanelProps {
	item: BaseItemDto | undefined | null;
	audioRef: React.RefObject<HTMLAudioElement> | null;
}

const StatRow = ({
	label,
	value,
}: {
	label: string;
	value: string | number | undefined | null;
}) => (
	<Box
		sx={{
			display: "flex",
			justifyContent: "space-between",
			mb: 1,
			borderBottom: "1px solid rgba(255,255,255,0.1)",
			pb: 0.5,
		}}
	>
		<Typography variant="body2" sx={{ opacity: 0.7, fontFamily: "monospace" }}>
			{label}
		</Typography>
		<Typography
			variant="body2"
			sx={{ fontFamily: "monospace", fontWeight: 600 }}
		>
			{value || "-"}
		</Typography>
	</Box>
);

const StatsPanel: React.FC<StatsPanelProps> = ({ item, audioRef }) => {
	const [buffered, setBuffered] = useState<string>("0%");

	useEffect(() => {
		const player = audioRef?.current;
		if (!player) return;

		const updateStats = () => {
			if (player.buffered.length > 0) {
				const bufferedEnd = player.buffered.end(player.buffered.length - 1);
				const duration = player.duration;
				if (duration > 0) {
					setBuffered(`${Math.round((bufferedEnd / duration) * 100)}%`);
				}
			}
		};

		const interval = setInterval(updateStats, 1000);
		return () => clearInterval(interval);
	}, [audioRef]);

	const mediaSource = item?.MediaSources?.[0];
	const mediaStream = mediaSource?.MediaStreams?.find(
		(s) => s.Type === "Audio",
	);

	return (
		<Box sx={{ p: 2 }}>
			<Typography variant="h6" sx={{ mb: 2 }}>
				Stats for Nerds
			</Typography>

			<Paper
				sx={{
					p: 2,
					background: "rgba(0,0,0,0.2)",
					backdropFilter: "blur(10px)",
				}}
			>
				<Typography
					variant="subtitle2"
					sx={{ mb: 1, opacity: 0.5, textTransform: "uppercase" }}
				>
					Media Source
				</Typography>
				<StatRow label="Container" value={mediaSource?.Container} />
				<StatRow
					label="Bitrate"
					value={
						mediaSource?.Bitrate
							? `${Math.round(mediaSource.Bitrate / 1000)} kbps`
							: undefined
					}
				/>
				<StatRow
					label="Size"
					value={
						mediaSource?.Size
							? `${(mediaSource.Size / 1024 / 1024).toFixed(2)} MB`
							: undefined
					}
				/>
				<StatRow label="Path" value={mediaSource?.Path} />

				<Box sx={{ mt: 3 }}>
					<Typography
						variant="subtitle2"
						sx={{ mb: 1, opacity: 0.5, textTransform: "uppercase" }}
					>
						Audio Stream
					</Typography>
					<StatRow label="Codec" value={mediaStream?.Codec} />
					<StatRow label="Channels" value={mediaStream?.Channels} />
					<StatRow
						label="Sample Rate"
						value={
							mediaStream?.SampleRate
								? `${mediaStream.SampleRate} Hz`
								: undefined
						}
					/>
					<StatRow label="Bit Depth" value={mediaStream?.BitDepth} />
					<StatRow label="Language" value={mediaStream?.Language} />
				</Box>

				<Box sx={{ mt: 3 }}>
					<Typography
						variant="subtitle2"
						sx={{ mb: 1, opacity: 0.5, textTransform: "uppercase" }}
					>
						Player
					</Typography>
					<StatRow label="Buffered" value={buffered} />
					<StatRow
						label="Volume"
						value={
							audioRef?.current
								? `${Math.round(audioRef.current.volume * 100)}%`
								: undefined
						}
					/>
					<StatRow
						label="Playback Rate"
						value={audioRef?.current?.playbackRate}
					/>
				</Box>
			</Paper>
		</Box>
	);
};

export default React.memo(StatsPanel);
