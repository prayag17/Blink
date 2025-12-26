import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import {
	Box,
	IconButton,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Typography,
} from "@mui/material";
import React from "react";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import { getTypeIcon } from "../utils/iconsCollection";

type QueueListItemProps = {
	queueItem: BaseItemDto;
	active?: boolean;
	onDelete?: () => void;
	onPlay?: () => void;
	dragHandleProps?: any;
	isEpisode?: boolean;
	index?: number;
	className?: string;
	sx?: any;
};

const QueueListItem = ({
	queueItem,
	active,
	onDelete,
	onPlay,
	dragHandleProps,
	isEpisode,
	index,
	className,
	sx,
}: QueueListItemProps) => {
	const api = useApiInContext((s) => s.api);

	const imageUrl =
		api &&
		queueItem.Id &&
		(queueItem.ImageTags?.Primary
			? getImageUrlsApi(api).getItemImageUrlById(queueItem.Id, "Primary", {
					tag: queueItem.ImageTags.Primary,
				})
			: queueItem.AlbumPrimaryImageTag?.[0]
				? getImageUrlsApi(api).getItemImageUrlById(
						queueItem.AlbumId || "",
						"Primary",
						{ tag: queueItem.AlbumPrimaryImageTag[0] },
					)
				: null);

	const primaryText = queueItem.SeriesName || queueItem.Name;

	let secondaryText = "";
	if (isEpisode) {
		const season = queueItem.ParentIndexNumber;
		const episode = queueItem.IndexNumber;
		const episodeEnd = queueItem.IndexNumberEnd;
		const episodeString = episodeEnd
			? `S${season}:E${episode}-${episodeEnd}`
			: `S${season}:E${episode}`;

		secondaryText = `${episodeString} - ${queueItem.Name}`;
	} else {
		secondaryText = queueItem.Artists?.join(", ") || "";
	}

	return (
		<ListItem
			component="div"
			className={className}
			secondaryAction={
				onDelete && (
					<IconButton
						edge="end"
						aria-label="delete"
						onClick={onDelete}
						size="small"
						sx={{
							opacity: 0,
							transition: "opacity 0.2s",
							".MuiListItem-root:hover &": { opacity: 0.7 },
							"&:hover": { opacity: "1 !important", bgcolor: "action.hover" },
						}}
					>
						<span className="material-symbols-rounded" style={{ fontSize: 20 }}>
							close
						</span>
					</IconButton>
				)
			}
			sx={{
				opacity: active ? 1 : 1,
				bgcolor: active ? "transparent" : "background.paper",
				borderRadius: 3,
				mb: 0,
				transition: "all 0.2s ease",
				border: active ? "none" : "1px solid",
				borderColor: "divider",
				"&:hover": {
					bgcolor: active ? "transparent" : "action.hover",
					transform: active ? "none" : "translateY(-2px)",
					boxShadow: active ? "none" : 2,
				},
				pr: onDelete ? 6 : 2,
				...sx,
			}}
		>
			{dragHandleProps && (
				<div
					{...dragHandleProps}
					style={{
						cursor: "grab",
						marginRight: 12,
						display: "flex",
						alignItems: "center",
						opacity: 0.3,
						transition: "opacity 0.2s",
					}}
					className="drag-handle"
				>
					<span className="material-symbols-rounded">drag_indicator</span>
				</div>
			)}

			<ListItemAvatar sx={{ minWidth: 64 }}>
				<Box
					onClick={onPlay}
					sx={{
						width: 48,
						height: 48,
						borderRadius: 2,
						overflow: "hidden",
						position: "relative",
						boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
						cursor: onPlay ? "pointer" : "default",
						"&:hover .play-overlay": {
							opacity: 1,
						},
					}}
				>
					{imageUrl ? (
						<img
							src={imageUrl}
							alt={queueItem.Name || ""}
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
					) : (
						<div
							style={{
								width: "100%",
								height: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								background: "#2a2a2a",
							}}
						>
							{queueItem.Type && getTypeIcon(queueItem.Type)}
						</div>
					)}
					{active && (
						<div
							style={{
								position: "absolute",
								inset: 0,
								background: "rgba(0,0,0,0.4)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								backdropFilter: "blur(2px)",
							}}
						>
							<span
								className="material-symbols-rounded"
								style={{ fontSize: "1.5rem", color: "white" }}
							>
								equalizer
							</span>
						</div>
					)}
					{!active && onPlay && (
						<Box
							className="play-overlay"
							sx={{
								position: "absolute",
								inset: 0,
								background: "rgba(0,0,0,0.4)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								opacity: 0,
								transition: "opacity 0.2s",
								backdropFilter: "blur(1px)",
							}}
						>
							<span
								className="material-symbols-rounded"
								style={{ fontSize: "2rem", color: "white" }}
							>
								play_arrow
							</span>
						</Box>
					)}
				</Box>
			</ListItemAvatar>

			<ListItemText
				primary={primaryText}
				secondary={secondaryText}
				primaryTypographyProps={{
					noWrap: true,
					variant: "body2",
					fontWeight: active ? 700 : 500,
					sx: { mb: 0.5 },
				}}
				secondaryTypographyProps={{
					noWrap: true,
					variant: "caption",
					sx: { opacity: 0.7 },
				}}
			/>
		</ListItem>
	);
};

export default QueueListItem;
