import { useApiInContext } from "@/utils/store/api";
import { useAudioPlayback } from "@/utils/store/audioPlayback";
import useQueue from "@/utils/store/queue";
import { Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

import "./audio.scss";

export const Route = createFileRoute("/_api/player/audio")({
	component: AudioPlayerRoute,
});

function AudioPlayerRoute() {
	const item = useAudioPlayback((s) => s.item);
	const api = useApiInContext((s) => s.api);
	const [queue, currentTrack] = useQueue((s) => [
		s.currentItemIndex,
		s.currentItemIndex,
	]);
	return (
		<div className="scrollY padded-top">
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
					<Typography variant="h4" fontWeight={300}>
						{item?.Name}
					</Typography>
					<Typography
						variant="subtitle1"
						fontWeight={300}
						className="opacity-07"
					>
						by {item?.Artists?.join(", ")}
					</Typography>
				</div>
			</div>
			<div className="audio-lyrics-container"></div>
		</div>
	);
}