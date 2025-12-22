import { IconButton, Paper, Typography } from "@mui/material";
import React, { type RefObject, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { usePlaybackStore } from "@/utils/store/playback";

interface StatsForNerdsProps {
	playerRef: RefObject<HTMLVideoElement>;
}

const StatsForNerds = ({ playerRef }: StatsForNerdsProps) => {
	const {
		showStatsForNerds,
		toggleShowStatsForNerds,
		itemId,
		mediaSourceId,
		playsessionId,
		volume,
		isBuffering,
		playbackStream,
		mediaSource,
	} = usePlaybackStore(
		useShallow((state) => ({
			showStatsForNerds: state.playerState.showStatsForNerds,
			toggleShowStatsForNerds: state.toggleShowStatsForNerds,
			itemId: state.metadata.item?.Id,
			mediaSourceId: state.mediaSource.id,
			playsessionId: state.playsessionId,
			volume: state.playerState.volume,
			isBuffering: state.playerState.isBuffering,
			playbackStream: state.playbackStream,
			mediaSource: state.mediaSource,
		})),
	);

	const [videoStats, setVideoStats] = useState<{
		resolution: string;
		droppedFrames: number;
		totalFrames: number;
		buffered: string;
	}>({
		resolution: "-",
		droppedFrames: 0,
		totalFrames: 0,
		buffered: "-",
	});

	useEffect(() => {
		if (!showStatsForNerds) return;

		const interval = setInterval(() => {
			if (playerRef.current) {
				const internalPlayer = playerRef.current as HTMLVideoElement;
				if (internalPlayer) {
					const quality = internalPlayer.getVideoPlaybackQuality?.();

					let bufferedEnd = 0;
					if (internalPlayer.buffered.length > 0) {
						// Find the buffered range that covers the current time
						for (let i = 0; i < internalPlayer.buffered.length; i++) {
							if (
								internalPlayer.buffered.start(i) <=
									internalPlayer.currentTime &&
								internalPlayer.buffered.end(i) >= internalPlayer.currentTime
							) {
								bufferedEnd = internalPlayer.buffered.end(i);
								break;
							}
						}
					}

					setVideoStats({
						resolution:
							internalPlayer.videoWidth && internalPlayer.videoHeight
								? `${internalPlayer.videoWidth}x${internalPlayer.videoHeight}`
								: "-",
						droppedFrames: quality?.droppedVideoFrames ?? 0,
						totalFrames: quality?.totalVideoFrames ?? 0,
						buffered: `${(bufferedEnd - internalPlayer.currentTime).toFixed(2)}s`,
					});
				}
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [showStatsForNerds, playerRef]);

	if (!showStatsForNerds) return null;

	return (
		<Paper
			className="glass"
			sx={{
				position: "absolute",
				top: "2em",
				left: "2em",
				padding: "1em",
				color: "white",
				zIndex: 100,
				maxWidth: "400px",
				fontSize: "0.8rem",
				fontFamily: "monospace",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "0.5em",
				}}
			>
				<Typography variant="subtitle2" fontWeight="bold">
					Stats for Nerds
				</Typography>
				<IconButton
					size="small"
					onClick={toggleShowStatsForNerds}
					sx={{ color: "white" }}
				>
					<span
						className="material-symbols-rounded"
						style={{ fontSize: "1.2rem" }}
					>
						close
					</span>
				</IconButton>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "auto 1fr",
					gap: "0.5em 1em",
				}}
			>
				<span>Video ID:</span> <span>{itemId}</span>
				<span>Media Source ID:</span> <span>{mediaSourceId}</span>
				<span>Play Session ID:</span> <span>{playsessionId}</span>
				<span>Playback Method:</span>{" "}
				<span>{mediaSource.playMethod}</span>
				<span>Container:</span> <span>{mediaSource.container}</span>
				<span>Video Codec:</span> <span>{mediaSource.videoCodec}</span>
				<span>Audio Codec:</span> <span>{mediaSource.audioCodec}</span>
				<span>Bitrate:</span>{" "}
				<span>
					{mediaSource.bitrate
						? `${(mediaSource.bitrate / 1000000).toFixed(2)} Mbps`
						: "-"}
				</span>
				<span>Stream URL:</span>{" "}
				<span style={{ wordBreak: "break-all" }}>{playbackStream}</span>
				<span>Resolution:</span> <span>{videoStats.resolution}</span>
				<span>Volume:</span> <span>{Math.round(volume * 100)}%</span>
				<span>Buffer Health:</span> <span>{videoStats.buffered}</span>
				<span>Dropped Frames:</span>{" "}
				<span>
					{videoStats.droppedFrames} / {videoStats.totalFrames}
				</span>
				<span>Is Buffering:</span> <span>{isBuffering ? "Yes" : "No"}</span>
			</div>
		</Paper>
	);
};

export default StatsForNerds;
