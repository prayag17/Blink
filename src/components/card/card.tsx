/** @format */

import React, { memo } from "react";

import { useNavigate } from "@tanstack/react-router";

import Typography from "@mui/material/Typography";

import {
	type BaseItemDto,
	BaseItemKind,
	type ImageType,
} from "@jellyfin/sdk/lib/generated-client";
import { ErrorBoundary } from "react-error-boundary";
import LikeButton from "../buttons/likeButton";
import MarkPlayedButton from "../buttons/markPlayedButton";
import PlayButton from "../buttons/playButton";
import { getTypeIcon } from "../utils/iconsCollection";
import "./card.scss";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";

import { useInView } from "react-intersection-observer";

const CardComponent = ({
	item,
	cardTitle,
	cardCaption,
	imageType = "Primary",
	cardType = "square",
	queryKey,
	userId,
	seriesId,
	hideText = false,
	onClick,
	disableOverlay = false,
	overrideIcon,
}: {
	item: BaseItemDto;
	cardTitle: string | undefined | null;
	cardCaption?: string | null | number;
	imageType?: ImageType;
	cardType: "square" | "thumb" | "portrait";
	queryKey?: string[];
	userId?: string;
	seriesId?: string | null;
	hideText?: boolean;
	onClick?: () => void;
	disableOverlay?: boolean;
	overrideIcon?: any;
}) => {
	const api = useApiInContext((s) => s.api);
	const navigate = useNavigate();
	const defaultOnClick = () => {
		if (item?.Id) {
			switch (item?.Type) {
				case BaseItemKind.BoxSet:
					navigate({ to: "/boxset/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.Episode:
					navigate({ to: "/episode/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.MusicAlbum:
					navigate({ to: "/album/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.MusicArtist:
					navigate({ to: "/artist/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.Person:
					navigate({ to: "/person/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.Series:
					navigate({ to: "/series/$id", params: { id: item.Id } });
					break;
				case BaseItemKind.Playlist:
					navigate({ to: "/playlist/$id", params: { id: item.Id } });
					break;
				default:
					navigate({ to: "/item/$id", params: { id: item.Id } });
					break;
			}
		}
	};

	const { ref, inView } = useInView({
		threshold: 0,
	});

	return (
		<div
			className="card"
			ref={ref}
			onClick={onClick ? onClick : defaultOnClick}
		>
			<div className={`card-image-container ${cardType}`}>
				<ErrorBoundary fallback>
					<div
						className="card-indicator check"
						style={{
							opacity: item.UserData?.Played ? 1 : 0,
						}}
					>
						<div className="material-symbols-rounded">done</div>
					</div>
					<div
						className={"card-indicator text"}
						style={{
							opacity: item.UserData?.UnplayedItemCount ? 1 : 0,
						}}
					>
						<Typography
							variant="subtitle2"
							padding="0.1em 0.4em"
							fontWeight={400}
						>
							{item.UserData?.UnplayedItemCount}
						</Typography>
					</div>
				</ErrorBoundary>
				<div className="card-image-icon-container">
					{overrideIcon
						? getTypeIcon(overrideIcon)
						: getTypeIcon(item.Type ?? "universal")}
				</div>
				{inView && (
					<img
						alt={item.Name ?? "blink"}
						src={
							api
								? overrideIcon === "User"
									? `${api?.basePath}/Users/${item.Id}/Images/Primary`
									: getImageUrlsApi(api).getItemImageUrlById(
											(seriesId ? item.SeriesId : (item.AlbumId ?? item.Id)) ??
												"",
											imageType,
											{
												quality: 90,
												fillWidth: cardType === "thumb" ? 560 : 320,
											},
										)
								: ""
						}
						style={{
							height: "100%",
							width: "100%",
							opacity: 0,
						}}
						loading="lazy"
						onLoad={(e) => {
							e.currentTarget.style.setProperty("opacity", "1");
						}}
						onLoadStart={(e) => console.log(e)}
						className="card-image"
					/>
				)}

				{inView && !disableOverlay && (
					<div className="card-overlay">
						<PlayButton
							item={item}
							userId={userId}
							itemType={item.Type ?? "Movie"}
							currentAudioTrack="auto"
							currentSubTrack={-1}
							currentVideoTrack={0}
							className="card-play-button"
							iconOnly
							audio={
								item.Type === BaseItemKind.MusicAlbum ||
								item.Type === BaseItemKind.Audio ||
								item.Type === BaseItemKind.AudioBook ||
								item.Type === BaseItemKind.Playlist
							}
							playlistItem={item.Type === BaseItemKind.Playlist}
							playlistItemId={item.Id}
						/>
						<LikeButton
							itemId={item.Id}
							itemName={item.Name ?? ""}
							isFavorite={item.UserData?.IsFavorite}
							queryKey={queryKey}
							userId={userId}
						/>
						<MarkPlayedButton
							itemId={item.Id}
							itemName={item.Name ?? ""}
							isPlayed={item.UserData?.Played}
							queryKey={queryKey}
							userId={userId}
						/>
					</div>
				)}
				{(item.UserData?.PlaybackPositionTicks ?? -1) > 0 && (
					<div className="card-progress-container">
						<div
							className="card-progress"
							style={{
								width: `${item.UserData?.PlayedPercentage}%`,
							}}
						/>
					</div>
				)}
			</div>
			<div
				className="card-text-container"
				style={{ display: hideText ? "none" : "block" }}
			>
				<Typography mt={1} variant="subtitle2" noWrap style={{ opacity: 0.9 }}>
					{cardTitle}
				</Typography>
				<Typography
					variant="caption"
					noWrap
					style={{ opacity: 0.6 }}
					lineHeight="auto"
				>
					{cardCaption}
				</Typography>
			</div>
		</div>
	);
};

export const Card = memo(CardComponent);