import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	type DropAnimation,
	defaultDropAnimationSideEffects,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	restrictToVerticalAxis,
	restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import {
	Box,
	IconButton,
	Menu,
	MenuItem,
	Tooltip,
	Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import QueueListItem from "@/components/queueListItem";
import { stopPlayback } from "@/utils/store/audioPlayback";
import useQueue, {
	clearQueue,
	removeFromQueue,
	setQueue,
	shuffleUpcoming,
} from "@/utils/store/queue";

interface QueuePanelProps {
	queue: BaseItemDto[];
	currentTrackIndex: number;
}

const dropAnimation: DropAnimation = {
	sideEffects: defaultDropAnimationSideEffects({
		styles: {
			active: {
				opacity: "0.5",
			},
		},
	}),
};

function SortableQueueItem({
	item,
	onDelete,
	index,
	isActive,
}: {
	item: BaseItemDto;
	onDelete: () => void;
	index: number;
	isActive: boolean;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.Id || "" });

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0.3 : 1,
		position: "relative" as const,
		zIndex: isDragging ? 999 : "auto",
	};

	return (
		<div ref={setNodeRef} style={style} className="sortable-queue-item">
			<QueueListItem
				queueItem={item}
				onDelete={onDelete}
				dragHandleProps={{ ...attributes, ...listeners }}
				isEpisode={item.Type === "Episode"}
				index={index}
				className={isActive ? "active" : ""}
				sx={{
					bgcolor: isActive
						? "rgba(255, 255, 255, 0.1) !important"
						: "transparent",
					borderRadius: 2,
					mb: 1,
					transition: "background-color 0.2s",
					"&:hover": {
						bgcolor: "rgba(255, 255, 255, 0.05)",
					},
					".MuiListItemText-primary": {
						color: isActive ? "var(--primary-color, #90caf9)" : "inherit",
						fontWeight: isActive ? 600 : 500,
						fontSize: "1rem",
					},
					".MuiListItemText-secondary": {
						fontSize: "0.85rem",
						opacity: 0.7,
					},
				}}
			/>
		</div>
	);
}

const QueuePanel = ({ queue, currentTrackIndex }: QueuePanelProps) => {
	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const activeItem = useMemo(
		() => queue.find((item) => item.Id === activeId),
		[queue, activeId],
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(String(event.active.id));
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);

		if (active.id !== over?.id) {
			const oldIndex = queue.map((item) => item.Id).indexOf(String(active.id));
			const newIndex = queue.map((item) => item.Id).indexOf(String(over?.id));

			if (oldIndex !== -1 && newIndex !== -1) {
				const newQueue = arrayMove(queue, oldIndex, newIndex);
				const currentTrackId = queue[currentTrackIndex]?.Id;
				const newCurrentTrackIndex = newQueue.findIndex(
					(item) => item.Id === currentTrackId,
				);

				setQueue(
					newQueue,
					newCurrentTrackIndex !== -1 ? newCurrentTrackIndex : 0,
				);
			}
		}
	};

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleClearQueue = () => {
		stopPlayback();
		clearQueue();
		handleClose();
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
		>
			<div
				className="audio-queue-container"
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 2,
						px: 1,
					}}
				>
					<Typography variant="h6" fontWeight={700}>
						Queue
					</Typography>
					<Box sx={{ display: "flex", gap: 1 }}>
						<Tooltip title="Shuffle Upcoming">
							<IconButton onClick={() => shuffleUpcoming()} size="small">
								<span className="material-symbols-rounded">shuffle</span>
							</IconButton>
						</Tooltip>
						<IconButton onClick={handleClick} size="small">
							<span className="material-symbols-rounded">more_vert</span>
						</IconButton>
					</Box>
					<Menu
						anchorEl={anchorEl}
						open={open}
						onClose={handleClose}
						transformOrigin={{ horizontal: "right", vertical: "top" }}
						anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
					>
						<MenuItem onClick={handleClearQueue}>
							<span
								className="material-symbols-rounded"
								style={{ marginRight: "0.5em", fontSize: "1.2em" }}
							>
								clear_all
							</span>
							Clear Queue
						</MenuItem>
					</Menu>
				</Box>

				<SortableContext
					items={queue.map((track) => track.Id ?? "")}
					strategy={verticalListSortingStrategy}
				>
					<div
						className="audio-queue"
						style={{ display: "flex", flexDirection: "column", gap: "0px" }}
					>
						{queue.map((track, index) => (
							<SortableQueueItem
								key={track.Id}
								item={track}
								index={index}
								onDelete={() => removeFromQueue(index)}
								isActive={currentTrackIndex === index}
							/>
						))}
					</div>
				</SortableContext>

				<DragOverlay
					dropAnimation={dropAnimation}
					style={{
						left: "1.5rem",
					}}
				>
					{activeItem ? (
						<QueueListItem
							queueItem={activeItem}
							isEpisode={activeItem.Type === "Episode"}
							dragHandleProps={{}} // Pass empty object to render handle
							onDelete={() => {}} // Pass empty function to render delete button space
							sx={{
								bgcolor: "rgba(40, 40, 40, 0.9)",
								backdropFilter: "blur(10px)",
								borderRadius: 2,
								boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
								outline: "1px solid rgba(255, 255, 255, 0.1)",
								mb: 1,
								".MuiListItemText-primary": {
									fontWeight: 500,
									fontSize: "1rem",
								},
								".MuiListItemText-secondary": {
									fontSize: "0.85rem",
									opacity: 0.7,
								},
							}}
						/>
					) : null}
				</DragOverlay>
			</div>
		</DndContext>
	);
};

export default React.memo(QueuePanel);
