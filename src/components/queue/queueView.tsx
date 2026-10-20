import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useSnackbar } from "notistack";
import React, { useMemo, useState } from "react";
import { getRuntimeCompact } from "@/utils/date/time";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { playItemFromQueue } from "@/utils/store/playback";
import useQueue, {
	clearUpcoming,
	insertIntoQueue,
	removeFromQueue,
	reorderQueue,
	shuffleUpcoming,
} from "@/utils/store/queue";
import { getQueueItemText, QueueRow, SortableQueueRow } from "./queueRow";

import "./queue.scss";

type QueueViewProps = {
	/**
	 * "drawer": standalone queue with the now playing row and a close button.
	 * "panel": embedded next to a full player that already shows the current track.
	 */
	variant: "drawer" | "panel";
	onClose?: () => void;
};

const QueueView = ({ variant, onClose }: QueueViewProps) => {
	const api = useApiInContext((s) => s.api);
	const userId = useCentralStore((s) => s.currentUser?.Id ?? undefined);
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();
	const [tracks, currentIndex] = useQueue((s) => [
		s.tracks,
		s.currentItemIndex,
	]);
	const [showHistory, setShowHistory] = useState(false);

	const queue = tracks ?? [];
	const current = queue[currentIndex];
	const history = queue.slice(0, currentIndex);
	const upcoming = useMemo(
		() => queue.slice(currentIndex + 1),
		[queue, currentIndex],
	);
	const upcomingTicks = upcoming.reduce(
		(total, item) => total + (item.RunTimeTicks ?? 0),
		0,
	);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const play = (index: number) => {
		playItemFromQueue(index, userId, api);
	};

	const remove = (item: BaseItemDto, index: number) => {
		removeFromQueue(index);
		const { title } = getQueueItemText(item);
		enqueueSnackbar(`Removed "${title}"`, {
			variant: "default",
			action: (key) => (
				<Button
					color="inherit"
					size="small"
					onClick={() => {
						insertIntoQueue(item, index);
						closeSnackbar(key);
					}}
				>
					Undo
				</Button>
			),
		});
	};

	const clearAll = () => {
		const removed = upcoming;
		clearUpcoming();
		enqueueSnackbar(`Cleared ${removed.length} tracks from up next`, {
			action: (key) => (
				<Button
					color="inherit"
					size="small"
					onClick={() => {
						const state = useQueue.getState();
						reorderQueue([
							...(state.tracks ?? []).slice(0, state.currentItemIndex + 1),
							...removed,
						]);
						closeSnackbar(key);
					}}
				>
					Undo
				</Button>
			),
		});
	};

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;
		const from = upcoming.findIndex((item) => item.Id === active.id);
		const to = upcoming.findIndex((item) => item.Id === over.id);
		if (from === -1 || to === -1) return;
		reorderQueue([
			...queue.slice(0, currentIndex + 1),
			...arrayMove(upcoming, from, to),
		]);
	};

	const summary =
		upcoming.length > 0
			? `${upcoming.length} ${upcoming.length === 1 ? "track" : "tracks"} · ${getRuntimeCompact(upcomingTicks)}`
			: "Nothing queued";

	return (
		<div className={`queue queue-${variant}`}>
			<header className="queue-header">
				<div className="queue-header-text">
					<h2 className="queue-title">
						{variant === "drawer" ? "Queue" : "Up next"}
					</h2>
					<span className="queue-summary">{summary}</span>
				</div>
				<div className="queue-header-actions">
					<Tooltip title="Shuffle up next">
						<span>
							<IconButton
								onClick={shuffleUpcoming}
								disabled={upcoming.length < 2}
								aria-label="Shuffle up next"
							>
								<span className="material-symbols-rounded">shuffle</span>
							</IconButton>
						</span>
					</Tooltip>
					<Tooltip title="Clear up next">
						<span>
							<IconButton
								onClick={clearAll}
								disabled={upcoming.length === 0}
								aria-label="Clear up next"
							>
								<span className="material-symbols-rounded">
									playlist_remove
								</span>
							</IconButton>
						</span>
					</Tooltip>
					{onClose && (
						<IconButton onClick={onClose} aria-label="Close queue">
							<span className="material-symbols-rounded">close</span>
						</IconButton>
					)}
				</div>
			</header>

			<div className="queue-body">
				{variant === "drawer" && current && (
					<section className="queue-section">
						<h3 className="queue-section-label">Now playing</h3>
						<QueueRow item={current} variant="current" />
					</section>
				)}

				<section className="queue-section">
					{variant === "drawer" && (
						<h3 className="queue-section-label">Up next</h3>
					)}
					{upcoming.length > 0 ? (
						<>
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd}
								modifiers={[restrictToVerticalAxis]}
							>
								<SortableContext
									items={upcoming.map((item) => item.Id ?? "")}
									strategy={verticalListSortingStrategy}
								>
									<div className="queue-list">
										{upcoming.map((item, offset) => {
											const index = currentIndex + 1 + offset;
											return (
												<SortableQueueRow
													key={item.Id ?? index}
													item={item}
													onPlay={() => play(index)}
													onRemove={() => remove(item, index)}
												/>
											);
										})}
									</div>
								</SortableContext>
							</DndContext>
							<p className="queue-hint">
								Click a track to play it now · drag to reorder
							</p>
						</>
					) : (
						<div className="queue-empty">
							<span className="material-symbols-rounded queue-empty-icon">
								queue_music
							</span>
							<span className="queue-empty-title">Nothing up next</span>
							<span className="queue-empty-text">
								Play an album, playlist or artist to fill the queue.
							</span>
						</div>
					)}
				</section>

				{history.length > 0 && (
					<section className="queue-section">
						<button
							type="button"
							className="queue-section-toggle"
							onClick={() => setShowHistory((open) => !open)}
							aria-expanded={showHistory}
						>
							<span className="queue-section-label">
								Previously played · {history.length}
							</span>
							<span className="material-symbols-rounded">
								{showHistory ? "expand_less" : "expand_more"}
							</span>
						</button>
						<Collapse in={showHistory} unmountOnExit>
							<div className="queue-list">
								{history.map((item, index) => (
									<QueueRow
										key={item.Id ?? index}
										item={item}
										variant="history"
										onPlay={() => play(index)}
										onRemove={() => remove(item, index)}
									/>
								))}
							</div>
						</Collapse>
					</section>
				)}
			</div>
		</div>
	);
};

export default QueueView;
