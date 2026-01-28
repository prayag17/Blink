/** @format */

import {
	type BaseItemDto,
	BaseItemKind,
	type ImageType,
} from "@jellyfin/sdk/lib/generated-client";
import { useNavigate } from "@tanstack/react-router";
import React, { memo, type Ref, useCallback, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useInView } from "react-intersection-observer";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import LikeButton from "../buttons/likeButton";
import MarkPlayedButton from "../buttons/markPlayedButton";
import PlayButton from "../buttons/playButton";
import { getTypeIcon } from "../utils/iconsCollection";
import "./card.scss";

interface CardProps {
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
	skipInView?: boolean;
}

const CardContent = ({
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
	inView,
	forwardedRef,
}: CardProps & {
	inView: boolean;
	forwardedRef?: Ref<HTMLDivElement>;
}) => {
	const api = useApiInContext((s) => s.api);
	const navigate = useNavigate();

	const defaultOnClick = useCallback(() => {
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
	}, [item?.Id, item?.Type, navigate]);

	return (
		<div
			className="card"
			ref={forwardedRef}
			onClick={onClick || defaultOnClick}
		>
			<div className={`card-image-container ${cardType}`}>
				<ErrorBoundary fallback={<></>}>
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
						<span
							style={{
								padding: "0.1em 0.4em",
								fontWeight: 400,
								fontSize: "0.875rem",
								lineHeight: 1.57,
								fontFamily: "inherit",
							}}
						>
							{item.UserData?.UnplayedItemCount}
						</span>
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
							display: "block",
							transition: "opacity 0.3s ease-in-out",
						}}
						loading="lazy"
						onLoad={(e) => {
							e.currentTarget.style.opacity = "1";
						}}
						className="card-image"
					/>
				)}
				{inView && !disableOverlay && (
					<div className="card-overlay">
						<PlayButton
							item={item}
							userId={userId}
							itemType={item.Type ?? "Movie"}
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
				style={{ display: hideText ? "none" : "block", marginLeft: "0.2em" }}
			>
				<div
					style={{
						marginTop: "8px",
						opacity: 0.9,
						fontSize: "0.875rem",
						fontWeight: 500,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{cardTitle}
				</div>
				<div
					style={{
						opacity: 0.6,
						fontSize: "0.75rem",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{cardCaption}
				</div>
			</div>
		</div>
	);
};

const CardWithInView = (props: CardProps) => {
	const { ref, inView } = useInView({
		threshold: 0.1,
	});

	return <CardContent {...props} inView={inView} forwardedRef={ref} />;
};

const CardComponent = (props: CardProps) => {
	if (props.skipInView) {
		return <CardContent {...props} inView={true} />;
	}
	return <CardWithInView {...props} />;
};

export const Card = memo(CardComponent);