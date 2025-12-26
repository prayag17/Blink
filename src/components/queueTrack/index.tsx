import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { IconButton, Typography } from "@mui/material";
import React from "react";
import { getRuntimeMusic } from "@/utils/date/time";
import useQueue from "@/utils/store/queue";

type Props = {
	track: BaseItemDto;
	index: number;
	onRemove?: () => void;
};
const QueueTrack = (props: Props) => {
	const { track, index, onRemove } = props;
	const [currentItemIndex] = useQueue((s) => [s.currentItemIndex]);

	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({
			id: track.Id ?? "",
		});

	const style = {
		// opacity: isDragging ? 0.5 : 1,
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={
				currentItemIndex === index
					? "audio-queue-track active"
					: "audio-queue-track"
			}
		>
			<span {...attributes} {...listeners} className="material-symbols-rounded">
				drag_handle
			</span>
			<div className="audio-queue-track-info">
				<Typography className="audio-queue-track-info-name">
					{track.Name}
				</Typography>
				<Typography fontWeight={300} className="opacity-07" variant="subtitle2">
					{track.Artists?.join(", ")}
				</Typography>
			</div>
			<div style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
				<Typography className="opacity-07">
					{getRuntimeMusic(track.RunTimeTicks ?? 0)}
				</Typography>
				{onRemove && (
					<IconButton size="small" onClick={onRemove}>
						<span
							className="material-symbols-rounded"
							style={{ fontSize: "1.2em" }}
						>
							close
						</span>
					</IconButton>
				)}
			</div>
		</div>
	);
};

export default QueueTrack;