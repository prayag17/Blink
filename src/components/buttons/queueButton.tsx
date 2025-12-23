import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import {
	Box,
	Drawer,
	IconButton,
	List,
	Tooltip,
	Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { playItemFromQueue } from "@/utils/store/playback";
import useQueue, {
	clearUpcoming,
	removeFromQueue,
	reorderQueue,
	shuffleUpcoming,
} from "@/utils/store/queue";
import "./queueButton.scss";
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
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { useApiInContext } from "@/utils/store/api";
import QueueListItem from "../queueListItem";

function SortableQueueItem({
	item,
	onDelete,
	onPlay,
	index,
}: {
	item: BaseItemDto;
	onDelete: () => void;
	onPlay: () => void;
	index: number;
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
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		position: "relative" as const,
		zIndex: isDragging ? 2 : 1,
	};

	return (
		<div ref={setNodeRef} style={style}>
			<QueueListItem
				queueItem={item}
				onDelete={onDelete}
				onPlay={onPlay}
				dragHandleProps={{ ...attributes, ...listeners }}
				isEpisode={item.Type === "Episode"}
				index={index}
			/>
		</div>
	);
}

const QueueButton = () => {
    const api = useApiInContext((s) => s.api);

    const [queueItems, currentItemIndex] = useQueue((state) => [
					state.tracks,
					state.currentItemIndex,
				]);

    const [open, setOpen] = useState(false);

	const user = useQuery({
		queryKey: ["currentUser"],
		queryFn: async () => {
			if (!api) throw new Error("API not available");
			return (await getUserApi(api).getCurrentUser()).data;
		},
		enabled: !!api,
	});

    const sensors = useSensors(
					useSensor(PointerSensor),
					useSensor(KeyboardSensor, {
						coordinateGetter: sortableKeyboardCoordinates,
					}),
				);

				const upcomingItems = useMemo(() => {
					return queueItems ? queueItems.slice(currentItemIndex + 1) : [];
				}, [queueItems, currentItemIndex]);

				const upcomingIds = useMemo(() => {
					return upcomingItems.map((item) => item.Id || "");
				}, [upcomingItems]);

				const handleDragEnd = (event: DragEndEvent) => {
					const { active, over } = event;

					if (active.id !== over?.id && queueItems) {
						const oldIndex = upcomingItems.findIndex(
							(item) => item.Id === active.id,
						);
						const newIndex = upcomingItems.findIndex(
							(item) => item.Id === over?.id,
						);

						if (oldIndex !== -1 && newIndex !== -1) {
							const newUpcoming = arrayMove(upcomingItems, oldIndex, newIndex);
							const newQueue = [
								...queueItems.slice(0, currentItemIndex + 1),
								...newUpcoming,
							];
							reorderQueue(newQueue);
						}
					}
				};

				const handleDelete = (index: number) => {
					removeFromQueue(index);
				};

				const handlePlay = (index: number) => {
					playItemFromQueue(index, user.data?.Id, api);
				};

				const handleClear = () => {
					clearUpcoming();
				};

				const handleShuffle = () => {
					shuffleUpcoming();
				};

    return (
					<>
						<Drawer
							anchor="right"
							open={open}
							onClose={() => setOpen(false)}
							PaperProps={{
								sx: {
									width: 450,
									maxWidth: "100%",
									display: "flex",
									flexDirection: "column",
									bgcolor: "background.default",
									backgroundImage: "none",
								},
							}}
						>
							<Box
								p={3}
								display="flex"
								justifyContent="space-between"
								alignItems="center"
								sx={{
									position: "sticky",
									top: 0,
									zIndex: 20,
									bgcolor: "background.default",
									borderBottom: "1px solid",
									borderColor: "divider",
								}}
							>
								<Box display="flex" alignItems="center" gap={1}>
									<Typography variant="h5" fontWeight="bold">
										Play Queue
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{
											ml: 1,
											fontWeight: 600,
											bgcolor: "action.hover",
											px: 1,
											py: 0.5,
											borderRadius: 2,
										}}
									>
										{queueItems?.length || 0}
									</Typography>
								</Box>
								<Box display="flex" gap={0.5}>
									<Tooltip title="Shuffle Upcoming">
										<span>
											<IconButton
												onClick={handleShuffle}
												size="small"
												disabled={upcomingItems.length < 2}
											>
												<span className="material-symbols-rounded">
													shuffle
												</span>
											</IconButton>
										</span>
									</Tooltip>
									<Tooltip title="Clear Upcoming">
										<span>
											<IconButton
												onClick={handleClear}
												size="small"
												disabled={upcomingItems.length === 0}
											>
												<span className="material-symbols-rounded">
													clear_all
												</span>
											</IconButton>
										</span>
									</Tooltip>
									<IconButton onClick={() => setOpen(false)} size="small">
										<span className="material-symbols-rounded">close</span>
									</IconButton>
								</Box>
							</Box>

							<Box
								sx={{
									overflowY: "auto",
									flex: 1,
									p: 2,
									"&::-webkit-scrollbar": { width: 8 },
									"&::-webkit-scrollbar-track": { background: "transparent" },
									"&::-webkit-scrollbar-thumb": {
										background: "rgba(128,128,128,0.2)",
										borderRadius: 4,
									},
									"&::-webkit-scrollbar-thumb:hover": {
										background: "rgba(128,128,128,0.3)",
									},
								}}
							>
								{queueItems && queueItems.length > 0 ? (
									<List disablePadding>
										{/* Current Item */}
										{queueItems[currentItemIndex] && (
											<Box sx={{ mb: 4 }}>
												<Typography
													variant="overline"
													sx={{
														display: "block",
														opacity: 0.6,
														mb: 1,
														fontWeight: 600,
														letterSpacing: 1.2,
													}}
												>
													NOW PLAYING
												</Typography>
												<Box
													sx={{
														bgcolor: "background.paper",
														borderRadius: 3,
														overflow: "hidden",
														boxShadow: 4,
														border: "1px solid",
														borderColor: "divider",
													}}
												>
													<QueueListItem
														queueItem={queueItems[currentItemIndex]}
														active={true}
														isEpisode={
															queueItems[currentItemIndex].Type === "Episode"
														}
														index={currentItemIndex + 1}
													/>
												</Box>
											</Box>
										)}

										{/* Upcoming Items */}
										{upcomingItems.length > 0 && (
											<>
												<Typography
													variant="overline"
													sx={{
														display: "block",
														opacity: 0.6,
														mb: 1,
														fontWeight: 600,
														letterSpacing: 1.2,
													}}
												>
													NEXT UP
												</Typography>
												<DndContext
													sensors={sensors}
													collisionDetection={closestCenter}
													onDragEnd={handleDragEnd}
													modifiers={[restrictToVerticalAxis]}
												>
													<SortableContext
														items={upcomingIds}
														strategy={verticalListSortingStrategy}
													>
														<Box
															sx={{
																display: "flex",
																flexDirection: "column",
																gap: 1,
															}}
														>
															{upcomingItems.map((item, index) => (
																<SortableQueueItem
																	key={item.Id || index}
																	item={item}
																	onDelete={() =>
																		handleDelete(currentItemIndex + 1 + index)
																	}
																	onPlay={() =>
																		handlePlay(currentItemIndex + 1 + index)
																	}
																	index={currentItemIndex + 1 + index + 1}
																/>
															))}
														</Box>
													</SortableContext>
												</DndContext>
											</>
										)}
									</List>
								) : (
									<Box
										p={4}
										textAlign="center"
										display="flex"
										flexDirection="column"
										alignItems="center"
										gap={2}
										sx={{ opacity: 0.5 }}
									>
										<span
											className="material-symbols-rounded"
											style={{ fontSize: 48 }}
										>
											queue_music
										</span>
										<Typography>Your queue is empty</Typography>
									</Box>
								)}
							</Box>
						</Drawer>
						<IconButton onClick={() => setOpen(true)}>
							<span className="material-symbols-rounded">playlist_play</span>
						</IconButton>
					</>
				);
};

export default QueueButton;