/** @format */
import React from "react";

import { useNavigate } from "react-router-dom";

import MuiCard from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";

import { Blurhash } from "react-blurhash";

import { TypeIconCollectionCard } from "../utils/iconsCollection";
import "./card.module.scss";
import { MdiCheck } from "../icons/mdiCheck";

import LikeButton from "../buttons/likeButton";
import MarkPlayedButton from "../buttons/markPlayedButton";
import PlayButton from "../buttons/playButton";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { useApi } from "../../utils/store/api";

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

/**
 * @typedef {Object} Props
 * @property {import("@jellyfin/sdk/lib/generated-client/models").BaseItemDto} item
 * @property {string}  cardTitle
 * @property {string | number}  cardCaption
 * @property {string} imageType
 * @property {string} imageBlurhash
 * @property {'thumb' | 'portrait' | 'square'} cardType
 * @property {Array} queryKey
 * @property {string} userId
 * @property {string} seriesId
 * @property {boolean} hideText
 * @property {() => {}} onClick
 * @property {boolean} disableOverlay
 * @property {boolean} disablePadding
 * @property {any} overrideIcon
 */

/**
 * @description Hero section for item pages
 * @param {Props}
 * @returns {React.Component}
 */

export const Card = ({
	item,
	cardTitle,
	cardCaption,
	imageType = "Primary",
	imageBlurhash,
	cardType,
	queryKey,
	userId,
	seriesId,
	hideText,
	onClick,
	disableOverlay = false,
	disablePadding,
	overrideIcon,
}) => {
	const [api] = useApi((state) => [state.api]);
	const navigate = useNavigate();
	const defaultOnClick = () => {
		if (availableSpecialRoutes.includes(item.Type)) {
			navigate(`/${item.Type.toLocaleLowerCase()}/${item.Id}`);
		} else if (!!item.Role || item.Type == BaseItemKind.Person) {
			navigate(`/person/${item.Id}`);
		} else if (item.Type == BaseItemKind.MusicArtist) {
			navigate(`/artist/${item.Id}`);
		} else {
			navigate(`/item/${item.Id}`);
		}
	};
	return (
		<CardActionArea
			style={{
				padding: disablePadding ? 0 : "0.6em",
				borderRadius: "calc(0.6em + 6px)",
			}}
			className="card-container"
			onClick={onClick ? onClick : defaultOnClick}
		>
			<MuiCard className="card" elevation={0}>
				<div className="card-box">
					<div
						className="card-image-container"
						style={{
							aspectRatio: cardImageAspectRatios[cardType],
						}}
					>
						{!!item.UserData && (
							<>
								<div
									className="card-indicator check"
									style={{
										opacity: item.UserData?.Played
											? 1
											: 0,
									}}
								>
									<MdiCheck />
								</div>
								<div
									className={`card-indicator text`}
									style={{
										opacity: item.UserData
											?.UnplayedItemCount
											? 1
											: 0,
									}}
								>
									<Typography
										variant="subtitle2"
										padding="0.1em 0.4em"
										fontWeight={400}
									>
										{
											item.UserData
												?.UnplayedItemCount
										}
									</Typography>
								</div>
							</>
						)}
						{!!imageBlurhash && (
							<Blurhash
								hash={imageBlurhash}
								width={128}
								height={128}
								resolutionX={24}
								resolutionY={24}
								className="card-image-blurhash"
							/>
						)}
						<div className="card-image-icon-container">
							{overrideIcon
								? TypeIconCollectionCard[overrideIcon]
								: TypeIconCollectionCard[item.Type]}
						</div>
						<img
							src={
								overrideIcon == "User"
									? `${api.basePath}/Users/${item.Id}/Images/Primary`
									: api.getItemImageUrl(
											seriesId
												? item.SeriesId
												: item.AlbumId
												? item.AlbumId
												: item.Id,
											imageType,
											{
												quality: 85,
												fillHeight: 462,
												fillWidth: 462,
											},
									  )
							}
							style={{
								height: "100%",
								width: "100%",
								opacity: 0,
							}}
							loading="lazy"
							onLoad={(e) => (e.target.style.opacity = 1)}
							className="card-image"
						/>
						{!disableOverlay && (
							<div className="card-overlay">
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
										item.Type ==
											BaseItemKind.MusicAlbum ||
										item.Type ==
											BaseItemKind.Audio ||
										item.Type ==
											BaseItemKind.AudioBook ||
										item.Type ==
											BaseItemKind.Playlist
									}
									playlistItem={
										item.Type ==
										BaseItemKind.Playlist
									}
									playlistItemId={item.Id}
								/>
								<LikeButton
									itemId={item.Id}
									itemName={item.Name}
									isFavorite={
										item.UserData?.IsFavorite
									}
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
							</div>
						)}
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
									background:
										"rgb(5 5 5 /  0.5) !important",
									backdropFilter: "blur(5px)",
								}}
								color="primary"
							/>
						)}
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
			</MuiCard>
		</CardActionArea>
	);
};
