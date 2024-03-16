/** @format */

import React from "react";
import { Component, useState } from "react";

import { useNavigate } from "react-router-dom";

import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import { useApi } from "../../utils/store/api";
import LikeButton from "../buttons/likeButton";
import MarkPlayedButton from "../buttons/markPlayedButton";
import PlayButton from "../buttons/playButton";
import ErrorBoundary from "../errorBoundary";
import { getTypeIcon } from "../utils/iconsCollection";
import "./card.module.scss";

const cardImageAspectRatios = {
	thumb: 1.777,
	portrait: 0.666,
	square: 1,
};

const availableSpecialRoutes = [
	BaseItemKind.Series,
	BaseItemKind.BoxSet,
	BaseItemKind.MusicAlbum,
	BaseItemKind.Episode,
	BaseItemKind.Playlist,
];

export const Card = ({
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
	cardTitle: string | null;
	cardCaption: string | null;
	imageType: string;
	cardType: string;
	queryKey: [];
	userId: string;
	seriesId: string | null;
	hideText: boolean;
	onClick: Function | null;
	disableOverlay: boolean;
	overrideIcon: any;
}) => {
	const [api] = useApi((state) => [state.api]);
	const navigate = useNavigate();
	const defaultOnClick = () => {
		if (availableSpecialRoutes.includes(item.Type)) {
			navigate(`/${item.Type.toLocaleLowerCase()}/${item.Id}`);
		} else if (!!item.Role || item.Type === BaseItemKind.Person) {
			navigate(`/person/${item.Id}`);
		} else if (item.Type === BaseItemKind.MusicArtist) {
			navigate(`/artist/${item.Id}`);
		} else {
			navigate(`/item/${item.Id}`);
		}
	};

	return (
		<div
			className="card"
			elevation={0}
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
						<div className="material-symbols-rounded">
							done
						</div>
					</div>
					<div
						className={"card-indicator text"}
						style={{
							opacity: item.UserData?.UnplayedItemCount
								? 1
								: 0,
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
				{/* {!!imageBlurhash && (
						<Blurhash
							hash={imageBlurhash}
							width={128}
							height={128}
							resolutionX={24}
							resolutionY={24}
							className="card-image-blurhash"
						/>
					)} */}
				<div className="card-image-icon-container">
					{overrideIcon
						? getTypeIcon(overrideIcon)
						: getTypeIcon(item.Type)}
				</div>
				<img
					alt={item.Name}
					src={
						overrideIcon === "User"
							? `${api.basePath}/Users/${item.Id}/Images/Primary`
							: api.getItemImageUrl(
									seriesId
										? item.SeriesId
										: item.AlbumId ?? item.Id,
									imageType,
									{
										quality: 90,
										fillWidth: 400,
									},
							  )
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
				<div className="card-overlay">
					{!disableOverlay && (
						<>
							<PlayButton
								itemId={item.Id}
								userId={userId}
								itemType={item.Type}
								currentAudioTrack={0}
								currentSubTrack={0}
								currentVideoTrack={0}
								className="card-play-button"
								iconProps={{
									style: { fontSize: "2.5em" },
								}}
								iconOnly
								audio={
									item.Type ===
										BaseItemKind.MusicAlbum ||
									item.Type === BaseItemKind.Audio ||
									item.Type ===
										BaseItemKind.AudioBook ||
									item.Type === BaseItemKind.Playlist
								}
								playlistItem={
									item.Type === BaseItemKind.Playlist
								}
								playlistItemId={item.Id}
							/>
							<LikeButton
								itemId={item.Id}
								itemName={item.Name}
								isFavorite={item.UserData?.IsFavorite}
								queryKey={queryKey}
								userId={userId}
							/>
							<MarkPlayedButton
								itemId={item.Id}
								itemName={item.Name}
								isPlayed={item.UserData?.Played}
								queryKey={queryKey}
								userId={userId}
							/>
						</>
					)}
				</div>
				{item.UserData?.PlaybackPositionTicks > 0 && (
					<div className="card-progress-container">
						<div
							className="card-progress"
							style={{
								width: `${item.UserData?.PlayedPercentage}%`,
							}}
						/>
					</div>
				)}
				{/*
				{item.UserData?.PlaybackPositionTicks > 0 && (
					<LinearProgress
						variant="determinate"
						value={item.UserData?.PlayedPercentage}
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							bottom: 0,
							zIndex: 2,
							height: "6px",
							background: "rgb(5 5 5 /  0.5) !important",
							backdropFilter: "blur(5px)",
						}}
						color="primary"
					/>
				)} */}
			</div>
			<div
				className="card-text-container"
				style={{ display: hideText ? "none" : "block" }}
			>
				<Typography
					variant="subtitle1"
					fontWeight={500}
					noWrap
					textAlign="center"
					style={{ opacity: 0.9 }}
				>
					{cardTitle}
				</Typography>
				<Typography
					variant="subtitle2"
					noWrap
					textAlign="center"
					style={{ opacity: 0.6 }}
					lineHeight="auto"
				>
					{cardCaption}
				</Typography>
			</div>
		</div>
	);
};
