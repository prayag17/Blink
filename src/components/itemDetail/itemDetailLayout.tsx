import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import Typography from "@mui/material/Typography";
import { motion } from "motion/react";
import React, { type ReactNode, useEffect, useRef } from "react";
import LikeButton from "@/components/buttons/likeButton";
import MarkPlayedButton from "@/components/buttons/markPlayedButton";
import TrailerButton from "@/components/buttons/trailerButton";
import IconLink from "@/components/iconLink";
import ItemHeader from "@/components/itemHeader";
import ShowMoreText from "@/components/showMoreText";
import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop";
import { useCentralStore } from "@/utils/store/central";
import type MediaQualityInfo from "@/utils/types/mediaQualityInfo";

import "./itemDetail.scss";

export const ExternalLinks = ({ item }: { item: BaseItemDto }) => (
	<div className="item-detail-external-links">
		{item.ExternalUrls?.map(
			(url) =>
				url.Url &&
				url.Name && <IconLink key={url.Url} url={url.Url} name={url.Name} />,
		)}
	</div>
);

const getDefaultBackdropHash = (item: BaseItemDto) => {
	const tag =
		item.Type === BaseItemKind.Episode
			? item.ParentBackdropImageTags?.[0]
			: item.BackdropImageTags?.[0];
	return (tag && item.ImageBlurHashes?.Backdrop?.[tag]) || "";
};

type ItemDetailLayoutProps = {
	item: BaseItemDto;
	/** CSS modifier, rendered as `item-<variant>`. */
	variant: "default" | "episode" | "series" | "boxset" | "person";
	mediaQualityInfo?: MediaQualityInfo;
	backdropSrc?: string | null;
	/** Blurhash for the app backdrop; defaults to the item's (or an episode's series) backdrop. */
	backdropHash?: string;
	/** Play button area; omitted for items that can't be played (people). */
	playButton?: ReactNode;
	showTrailer?: boolean;
	showMarkPlayed?: boolean;
	/** Extra content under the overview in the main column. */
	main?: ReactNode;
	/** Right-hand column next to the overview. */
	aside?: ReactNode;
	/** Sections rendered below the overview. */
	children?: ReactNode;
};

const ItemDetailLayout = ({
	item,
	variant,
	mediaQualityInfo,
	backdropSrc,
	backdropHash,
	playButton,
	showTrailer = true,
	showMarkPlayed = true,
	main,
	aside,
	children,
}: ItemDetailLayoutProps) => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const queryKey = ["item", item.Id ?? ""];

	const setBackdrop = useBackdropStore((s) => s.setBackdrop);
	const hash = backdropHash ?? getDefaultBackdropHash(item);
	useEffect(() => {
		setBackdrop(hash);
	}, [hash, setBackdrop]);

	return (
		<motion.div
			key={item.Id}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3, ease: "easeInOut" }}
			className={`scrollY padded-top flex flex-column item item-detail-page item-${variant}`}
			ref={containerRef}
		>
			<ItemHeader
				item={item}
				api={api}
				mediaQualityInfo={mediaQualityInfo}
				scrollTargetRef={containerRef}
				backdropSrc={backdropSrc}
			>
				<div className="item-hero-buttons-container">
					<div className="flex flex-row" style={{ width: "100%" }}>
						{playButton}
					</div>
					<div className="flex flex-row" style={{ gap: "1em" }}>
						{showTrailer && item.RemoteTrailers && (
							<TrailerButton
								trailerItem={item.RemoteTrailers}
								disabled={item.RemoteTrailers.length === 0}
							/>
						)}
						<LikeButton
							itemName={item.Name}
							itemId={item.Id}
							queryKey={queryKey}
							isFavorite={item.UserData?.IsFavorite}
							userId={user?.Id}
						/>
						{showMarkPlayed && (
							<MarkPlayedButton
								itemName={item.Name}
								itemId={item.Id}
								queryKey={queryKey}
								isPlayed={item.UserData?.Played}
								userId={user?.Id}
							/>
						)}
					</div>
				</div>
			</ItemHeader>
			<div className={aside ? "item-detail" : "item-detail single"}>
				<div className="fullWidth">
					{(item.Taglines?.length ?? 0) > 0 && (
						<Typography variant="h5" sx={{ mb: 2, fontWeight: 300 }}>
							{item.Taglines?.[0]}
						</Typography>
					)}
					<ShowMoreText content={item.Overview ?? ""} collapsedLines={4} />
					{main}
				</div>
				{aside && <div className="fullWidth">{aside}</div>}
			</div>
			{children}
		</motion.div>
	);
};

export default ItemDetailLayout;
