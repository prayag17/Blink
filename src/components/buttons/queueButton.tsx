import { playItemFromQueue } from "@/utils/store/playback";
import useQueue from "@/utils/store/queue";
import {
	IconButton,
	Menu,
	MenuItem,
	MenuList,
	Typography,
} from "@mui/material";
import React, { useState } from "react";
import { getTypeIcon } from "../utils/iconsCollection";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import "./queueButton.scss";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
const QueueButton = () => {
	const api = useApiInContext((s) => s.api);

	const [queueItems, currentItemIndex] = useQueue((state) => [
		state.tracks,
		state.currentItemIndex,
	]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			if (!api) return;
			const result = await getUserApi(api).getCurrentUser();
			return result.data;
		},
	});
	const [buttonEl, setButtonEl] = useState<HTMLButtonElement | null>(null);

	const handlePlay = useMutation({
		mutationKey: ["handlePlayIndex"],
		mutationFn: async ({ index }: { index: number }) => {
			const result = playItemFromQueue(index, user.data?.Id, api);
			return result;
		},
		onSuccess: () => {
			setButtonEl(null);
		},
		onError: (error) => {
			console.error(error);
		},
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
						height: "fit-content",
						width: " 32em",
						position: "relative",
					}}
				>
					{queueItems?.[currentItemIndex]?.Id && (
						<>
							<Typography px="1em" mb={2} variant="h5" fontWeight={300}>
								Currently Playing:
							</Typography>
							<MenuItem
								className="queue-item"
								disabled
								key={queueItems[currentItemIndex].Id}
							>
								<Typography variant="subtitle2">
									{queueItems[currentItemIndex]?.Type === "Audio"
										? currentItemIndex + 1
										: queueItems[currentItemIndex].IndexNumberEnd
											? `S${queueItems[currentItemIndex].ParentIndexNumber}:E${queueItems[currentItemIndex].IndexNumber} / ${queueItems[currentItemIndex].IndexNumberEnd}`
											: `S${queueItems[currentItemIndex].ParentIndexNumber}:E${queueItems[currentItemIndex].IndexNumber}`}
								</Typography>
								<div className="queue-item-image-container">
									{queueItems[currentItemIndex].ImageTags?.Primary ? (
										<img
											className="queue-item-image"
											src={
												api &&
												getImageUrlsApi(api).getItemImageUrlById(
													queueItems[currentItemIndex]?.Id,
													"Primary",
													{
														tag: queueItems[currentItemIndex].ImageTags
															?.Primary,
													},
												)
											}
											alt={queueItems[currentItemIndex].Name ?? "image"}
										/>
									) : (queueItems[currentItemIndex].AlbumPrimaryImageTag
											?.length ?? -1) > 0 ? (
										<img
											className="queue-item-image"
											src={
												api &&
												getImageUrlsApi(api).getItemImageUrlById(
													queueItems?.[currentItemIndex]?.AlbumId ?? "",
													"Primary",
													{
														tag: queueItems?.[currentItemIndex]
															.AlbumPrimaryImageTag?.[0],
													},
												)
											}
											alt={queueItems[currentItemIndex].Name ?? "image"}
										/>
									) : (
										<div className="queue-item-image-icon">
											{queueItems[currentItemIndex].Type &&
												getTypeIcon(queueItems[currentItemIndex].Type)}
										</div>
									)}
									<span
										className="material-symbols-rounded"
										style={{
											position: "absolute",
											top: "50%",
											left: "50%",
											transform: "translate(-50%,-50%)",
											fontSize: "2em",
											//@ts-ignore
											"--wght": "100",
										}}
									>
										equalizer
									</span>
								</div>
								<div className="queue-item-info">
									{queueItems[currentItemIndex].SeriesName ? (
										<>
											<Typography variant="subtitle1" width="100%">
												{queueItems[currentItemIndex].SeriesName}
											</Typography>
											<Typography
												variant="subtitle2"
												width="100%"
												style={{ opacity: 0.6 }}
											>
												{queueItems[currentItemIndex].Name}
											</Typography>
										</>
									) : (
										<Typography variant="subtitle1" width="100%">
											{queueItems[currentItemIndex].Name}
										</Typography>
									)}
								</div>
							</MenuItem>
						</>
					)}
					{queueItems &&
						queueItems.slice(currentItemIndex + 1, queueItems.length - 1)
							.length > 0 && (
							<Typography px="1em" my={2} variant="h5" fontWeight={300}>
								Queue:
							</Typography>
						)}
					{queueItems
						?.slice(currentItemIndex + 1, queueItems.length - 1)
						.map((item, index) => {
							return (
								<MenuItem
									className="queue-item"
									onClick={() =>
										handlePlay.mutate({ index: index + currentItemIndex })
									}
									key={item.Id}
								>
									<Typography variant="subtitle2">
										{item.Type === "Audio"
											? index + 1
											: item.IndexNumberEnd
												? `S${item.ParentIndexNumber}:E${item.IndexNumber} / ${item.IndexNumberEnd}`
												: `S${item.ParentIndexNumber}:E${item.IndexNumber}`}
									</Typography>
									<div className="queue-item-image-container">
										{item.ImageTags?.Primary ? (
											<img
												className="queue-item-image"
												src={
													api &&
													getImageUrlsApi(api).getItemImageUrlById(
														item?.Id ?? "",
														"Primary",
														{
															tag: item.ImageTags?.Primary,
														},
													)
												}
												alt={item.Name ?? "image"}
											/>
										) : (item.AlbumPrimaryImageTag?.length ?? -1) > 0 ? (
											<img
												className="queue-item-image"
												src={
													api &&
													getImageUrlsApi(api).getItemImageUrlById(
														item?.AlbumId ?? "",
														"Primary",
														{
															tag: item.AlbumPrimaryImageTag?.[0],
														},
													)
												}
												alt={item.Name ?? "image"}
											/>
										) : (
											<div className="queue-item-image-icon">
												{item.Type && getTypeIcon(item.Type)}
											</div>
										)}
									</div>
									<div className="queue-item-info">
										{item.SeriesName ? (
											<>
												<Typography
													variant="subtitle1"
													width="100%"
													sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
												>
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
											<>
												<Typography
													variant="subtitle1"
													width="100%"
													sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
												>
													{item.Name}
												</Typography>
												<Typography
													variant="subtitle2"
													width="100%"
													style={{ opacity: 0.6 }}
													sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
												>
													{item.Artists?.join(", ")}
												</Typography>
											</>
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