import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import React from "react";
import { getRuntimeMusic } from "@/utils/date/time";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";

export const getQueueItemText = (item: BaseItemDto) => {
	if (item.Type === "Episode") {
		const episode = item.IndexNumberEnd
			? `E${item.IndexNumber}-${item.IndexNumberEnd}`
			: `E${item.IndexNumber}`;
		return {
			title: item.Name ?? "Unknown episode",
			subtitle: [item.SeriesName, `S${item.ParentIndexNumber}:${episode}`]
				.filter(Boolean)
				.join(" · "),
		};
	}
	return {
		title: item.Name ?? "Unknown track",
		subtitle: item.Artists?.join(", ") || item.AlbumArtist || "",
	};
};

const useQueueItemImage = (item: BaseItemDto) => {
	const api = useApiInContext((s) => s.api);
	if (!api || !item.Id) return undefined;
	const size = { fillWidth: 96, fillHeight: 96, quality: 85 };
	if (item.ImageTags?.Primary) {
		return getImageUrlsApi(api).getItemImageUrlById(item.Id, "Primary", {
			...size,
			tag: item.ImageTags.Primary,
		});
	}
	if (item.AlbumId && item.AlbumPrimaryImageTag) {
		return getImageUrlsApi(api).getItemImageUrlById(item.AlbumId, "Primary", {
			...size,
			tag: item.AlbumPrimaryImageTag,
		});
	}
	return undefined;
};

type QueueRowProps = {
	item: BaseItemDto;
	variant: "current" | "upcoming" | "history";
	onPlay?: () => void;
	onRemove?: () => void;
	/** Drag handle props from useSortable (upcoming rows only). */
	dragHandle?: React.HTMLAttributes<HTMLButtonElement>;
	isDragging?: boolean;
};

export const QueueRow = React.forwardRef<
	HTMLDivElement,
	QueueRowProps & { style?: React.CSSProperties }
>(({ item, variant, onPlay, onRemove, dragHandle, isDragging, style }, ref) => {
	const imageUrl = useQueueItemImage(item);
	const { title, subtitle } = getQueueItemText(item);
	const isCurrent = variant === "current";

	return (
		<div
			ref={ref}
			style={style}
			className={`queue-row queue-row-${variant} ${isDragging ? "is-dragging" : ""}`}
			{...(onPlay && {
				role: "button",
				tabIndex: 0,
				"aria-label": `Play ${title}`,
			})}
			onClick={onPlay}
			onKeyDown={(e) => {
				if (e.target !== e.currentTarget) return;
				if (onPlay && (e.key === "Enter" || e.key === " ")) {
					e.preventDefault();
					onPlay();
				} else if (onRemove && (e.key === "Delete" || e.key === "Backspace")) {
					e.preventDefault();
					onRemove();
				}
			}}
		>
			{dragHandle && (
				<button
					type="button"
					className="queue-row-handle"
					aria-label={`Reorder ${title}`}
					onClick={(e) => e.stopPropagation()}
					{...dragHandle}
				>
					<span className="material-symbols-rounded">drag_indicator</span>
				</button>
			)}
			<div className="queue-row-art">
				<span className="material-symbols-rounded queue-row-art-fallback">
					{item.Type === "Episode" ? "tv_gen" : "music_note"}
				</span>
				{imageUrl && <img src={imageUrl} alt="" loading="lazy" />}
				{isCurrent && (
					<span className="queue-row-art-overlay material-symbols-rounded">
						graphic_eq
					</span>
				)}
				{onPlay && (
					<span className="queue-row-art-play material-symbols-rounded">
						play_arrow
					</span>
				)}
			</div>
			<div className="queue-row-text">
				<span className="queue-row-title" title={title}>
					{title}
				</span>
				{subtitle && <span className="queue-row-subtitle">{subtitle}</span>}
			</div>
			<span className="queue-row-duration">
				{item.RunTimeTicks ? getRuntimeMusic(item.RunTimeTicks) : ""}
			</span>
			{onRemove && (
				<Tooltip title="Remove from queue">
					<IconButton
						size="small"
						className="queue-row-remove"
						aria-label={`Remove ${title} from queue`}
						onClick={(e) => {
							e.stopPropagation();
							onRemove();
						}}
					>
						<span className="material-symbols-rounded">close</span>
					</IconButton>
				</Tooltip>
			)}
		</div>
	);
});

/** An upcoming row that can be dragged to reorder. */
export const SortableQueueRow = (
	props: Omit<QueueRowProps, "dragHandle" | "isDragging" | "variant">,
) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: props.item.Id ?? "" });

	return (
		<QueueRow
			{...props}
			ref={setNodeRef}
			variant="upcoming"
			isDragging={isDragging}
			style={{
				transform: CSS.Translate.toString(transform),
				transition,
				zIndex: isDragging ? 2 : undefined,
				position: "relative",
			}}
			dragHandle={
				{
					...attributes,
					...listeners,
					ref: setActivatorNodeRef,
				} as React.HTMLAttributes<HTMLButtonElement>
			}
		/>
	);
};
