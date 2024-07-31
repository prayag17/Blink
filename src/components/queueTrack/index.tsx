import { getRuntimeMusic } from "@/utils/date/time";
import useQueue, { setQueue } from "@/utils/store/queue";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { Typography } from "@mui/material";
import React from "react";
import { useCallback, useRef } from "react";
import { type XYCoord, useDrag, useDrop } from "react-dnd";
import type { Identifier } from "typescript";

type Props = {
	track: BaseItemDto;
	index: number;
};
const QueueTrack = (props: Props) => {
	const { track, index } = props;
	const [queue, currentItemIndex] = useQueue((s) => [
		s.tracks,
		s.currentItemIndex,
	]);
	const trackRef = useRef<HTMLDivElement | null>(null);
	const handleQueueUpdate = useCallback(
		(dragIndex: number, dropIndex: number) => {
			const prevState = queue;
			prevState.splice(dropIndex, 0, prevState.splice(dragIndex, 1)[0]);
			setQueue(prevState, dropIndex);
		},
		[queue],
	);

	const [{ handlerId }, drop] = useDrop<
		{
			index: number;
			id: string;
			type: string;
		},
		void,
		{ handlerId: Identifier | null }
	>({
		accept: "Row",
		collect(monitor) {
			return {
				handlerId: monitor.getHandlerId(),
			};
		},
		hover(hoverItem, monitor) {
			console.log(hoverItem);
			if (!trackRef.current) return;

			const dragIndex = hoverItem.index;
			const dropIndex = index;

			if (dragIndex === dropIndex) return;

			const hoverBoundingRect = trackRef.current?.getBoundingClientRect();
			const hoverMiddleY =
				(hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

			const clientOffset = monitor.getClientOffset();

			const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

			if (dragIndex < dropIndex && hoverClientY < hoverMiddleY) {
				return;
			}

			if (dragIndex > dropIndex && hoverClientY > hoverMiddleY) {
				return;
			}

			handleQueueUpdate(dragIndex, dropIndex);
			hoverItem.index = dropIndex;
		},
	});

	const [{ isDragging }, drag] = useDrag({
		type: "Row",
		item: () => {
			const id = track.Id;
			return { id, index };
		},
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	drag(drop(trackRef));

	return (
		<div
			ref={trackRef}
			style={{ opacity: isDragging ? 0.5 : 1 }}
			className={
				currentItemIndex === index
					? "audio-queue-track active"
					: "audio-queue-track"
			}
		>
			<span className="material-symbols-rounded">drag_handle</span>
			<div className="audio-queue-track-info">
				<Typography className="audio-queue-track-info-name">
					{track.Name}
				</Typography>
				<Typography fontWeight={300} className="opacity-07" variant="subtitle2">
					{track.Artists?.join(", ")}
				</Typography>
			</div>
			<Typography className="opacity-07">
				{getRuntimeMusic(track.RunTimeTicks)}
			</Typography>
		</div>
	);
};

export default QueueTrack;