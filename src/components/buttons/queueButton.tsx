import {
	IconButton,
	Menu,
	MenuItem,
	MenuList,
	Typography,
} from "@mui/material";
import React, { useRef, useState } from "react";
import { useApi } from "src/utils/store/api";
import { playItemFromQueue } from "src/utils/store/playback";
import useQueue from "src/utils/store/queue";
import { getTypeIcon } from "../utils/iconsCollection";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import "./queueButton.scss";
const QueueButton = () => {
	const [api] = useApi((state) => [state.api]);
	const [queueItems, currentItemIndex] = useQueue((state) => [
		state.tracks,
		state.currentItemIndex,
	]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const result = await getUserApi(api).getCurrentUser();
			return result.data;
		},
	});
	const [buttonEl, setButtonEl] = useState(null);

	const handlePlay = useMutation({
		mutationKey: ["handlePlayIndex"],
		mutationFn: async ({ index }: { index: number }) => {
			const result = playItemFromQueue(index, user.data?.Id);
			return result;
		},
		onSuccess: () => {
			setButtonEl(null);
		},
		onError: (error) => {
			console.error(error);
		},
	});

	const menuRef = useRef(null);
	const virtualizer = useVirtualizer({
		count: queueItems.length,
		estimateSize: () => 86,
		getScrollElement: () => menuRef.current,
		overscan: 3,
	});

	return (
		<>
			<Menu
				open={Boolean(buttonEl)}
				onClose={() => setButtonEl(null)}
				anchorEl={buttonEl}
				anchorOrigin={{
					vertical: "top",
					horizontal: "center",
				}}
				transformOrigin={{
					vertical: "bottom",
					horizontal: "center",
				}}
				slotProps={{
					paper: {
						ref: menuRef,
						style: {
							maxHeight: "30em",
							overflowX: "hidden",
							overflowY: "auto",
						},
					},
				}}
			>
				<MenuList
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: " 32em",
						position: "relative",
					}}
				>
					{virtualizer.getVirtualItems().map((virtualItem) => {
						const index = virtualItem.index;
						const item = queueItems[index];
						return (
							<MenuItem
								className="queue-item"
								key={item.Id}
								disabled={index === currentItemIndex}
								onClick={() => handlePlay.mutate({ index })}
								key={virtualItem.key}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									height: `${virtualItem.size}px`,
									transform: `translateY(${virtualItem.start}px)`,
								}}
							>
								<Typography variant="subtitle2">
									{item.IndexNumberEnd
										? `S${item.ParentIndexNumber}:E${item.IndexNumber} / ${item.IndexNumberEnd}`
										: `S${item.ParentIndexNumber}:E${item.IndexNumber}`}
								</Typography>
								<div className="queue-item-image-container">
									{item.ImageTags.Primary ? (
										<img
											className="queue-item-image"
											src={api?.getItemImageUrl(item?.Id, "Primary", {
												tag: item.ImageTags?.Primary,
											})}
											alt={item.Name}
										/>
									) : (
										<div className="queue-item-image-icon">
											{getTypeIcon(item.Type)}
										</div>
									)}
									{index === currentItemIndex && (
										<span
											className="material-symbols-rounded"
											style={{
												position: "absolute",
												top: "50%",
												left: "50%",
												transform: "translate(-50%,-50%)",
												fontSize: "2em",
												"--wght": "100",
											}}
										>
											equalizer
										</span>
									)}
								</div>
								<div className="queue-item-info">
									{item.SeriesName ? (
										<>
											<Typography variant="subtitle1" width="100%">
												{item.SeriesName}
											</Typography>
											<Typography
												variant="subtitle2"
												width="100%"
												style={{ opacity: 0.6 }}
											>
												{item.Name}
											</Typography>
										</>
									) : (
										<Typography variant="subtitle1" width="100%">
											{item.Name}
										</Typography>
									)}
								</div>
							</MenuItem>
						);
					})}
				</MenuList>
			</Menu>
			<IconButton onClick={(e) => setButtonEl(e.currentTarget)}>
				<span className="material-symbols-rounded">playlist_play</span>
			</IconButton>
		</>
	);
};

export default QueueButton;