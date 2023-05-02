/** @format */
import React, { useState } from "react";
import PropTypes from "prop-types";

import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import MuiCard from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import ButtonGroup from "@mui/material/ButtonGroup";
import IconButton from "@mui/material/IconButton";
import MuiLink from "@mui/material/Link";

import { Link } from "react-router-dom";

import { Blurhash } from "react-blurhash";
import { green, pink } from "@mui/material/colors";

import {
	MediaCollectionTypeIconCollectionCard,
	TypeIconCollectionCard,
} from "../utils/iconsCollection";

import { borderRadiusDefault } from "../../palette.module.scss";
import "./card.module.scss";
import { MdiCheck } from "../icons/mdiCheck";

import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { MdiHeartOutline } from "../icons/mdiHeartOutline";
import { MdiHeart } from "../icons/mdiHeart";

export const Card = ({
	itemName,
	itemId,
	imageTags,
	iconType,
	cardType = "",
	subText = "",
	playedPercent,
	cardOrientation,
	cardProps,
	onClickEvent,
	watchedStatus,
	watchedCount,
	blurhash,
	currentUser,
	favourite,
}) => {
	const navigate = useNavigate();
	const [imgLoading, setImgLoading] = useState(true);
	const [isWatched, setIsWatched] = useState(watchedStatus);
	const [isFavorite, setisFavorite] = useState(favourite);
	const [watchedCountState, setWatchedCountState] = useState(watchedCount);
	const handleMarkAsPlayOrUnMarkAsPlay = async () => {
		let result;
		if (!isWatched) {
			result = await getPlaystateApi(window.api).markPlayedItem({
				userId: currentUser.Id,
				itemId: itemId,
			});
		} else if (isWatched) {
			result = await getPlaystateApi(window.api).markUnplayedItem({
				userId: currentUser.Id,
				itemId: itemId,
			});
		}
		setIsWatched(result.data.Played);
		setWatchedCountState(result.data.UnplayedItemCount);
	};
	const handleLiking = async () => {
		let result;
		if (isFavorite) {
			result = await getUserLibraryApi(window.api).unmarkFavoriteItem({
				userId: currentUser.Id,
				itemId: itemId,
			});
		} else if (!isFavorite) {
			result = await getUserLibraryApi(window.api).markFavoriteItem({
				userId: currentUser.Id,
				itemId: itemId,
			});
		}
		setisFavorite(result.data.IsFavorite);
	};

	const availableMarkButtonTypes = [
		"Audio",
		"AudioBook",
		"Book",
		"BoxSet",
		"CollectionFolder",
		"Movie",
		"Season",
		"Series",
		"Video",
		"Episode",
	];
	const allowedLikeButton = [
		"Audio",
		"AudioBook",
		"Book",
		"BoxSet",
		"CollectionFolder",
		"Movie",
		"MusicAlbum",
		"MusicVideo",
		"Season",
		"Series",
		"Video",
		"Channel",
		"MusicAlbum",
		"MusicArtist",
		"Person",
		"Photo",
		"Playlist",
		"Studio",
		"Episode",
	];

	return (
		<MuiCard
			className={"card " + cardOrientation}
			sx={{
				background: "transparent",
				borderRadius: borderRadiusDefault,
				mr: 1,
			}}
			elevation={0}
			{...cardProps}
		>
			<CardActionArea
				sx={{ p: "1px" }}
				component={Box}
				onClick={
					!!onClickEvent
						? onClickEvent
						: () => {
								navigate(`/item/${itemId}`);
								console.log("going...");
						  }
				}
				className="cardBox"
			>
				<Box
					className="card-media-container"
					sx={{
						position: "relative",
						m: 1,
						aspectRatio:
							cardOrientation == "landscape"
								? "1.777"
								: cardOrientation == "portait"
								? "0.666"
								: "1",
					}}
				>
					<>
						<Chip
							className="card-indicator"
							label={<MdiCheck />}
							sx={{
								transition: "opacity 150ms",
								opacity: isWatched ? 1 : 0,
							}}
						/>

						{!!watchedCountState && (
							<Chip
								className="card-indicator card-indicator-text"
								label={watchedCountState}
							></Chip>
						)}
						<div
							className="card-media-image-container"
							style={{ opacity: imgLoading ? 0 : 1 }}
						>
							{imageTags &&
								(cardType == "thumb" ? (
									<CardMedia
										component="img"
										image={
											window.api.basePath +
											"/Items/" +
											itemId +
											"/Images/Backdrop?fillHeight=300&fillWidth=532&quality=96"
										}
										alt={itemName}
										sx={{
											width: "100%",
											aspectRatio:
												cardOrientation ==
												"landscape"
													? "1.777"
													: cardOrientation ==
													  "portait"
													? "0.666"
													: "1",
											borderRadius:
												borderRadiusDefault,
											overflow: "hidden",
										}}
										onLoad={() =>
											setImgLoading(false)
										}
										className="card-image"
									></CardMedia>
								) : (
									<CardMedia
										component="img"
										image={
											window.api.basePath +
											"/Items/" +
											itemId +
											"/Images/Primary?fillHeight=532&fillWidth=300&quality=96"
										}
										alt={itemName}
										sx={{
											width: "100%",
											aspectRatio:
												cardOrientation ==
												"landscape"
													? "1.777"
													: cardOrientation ==
													  "portait"
													? "0.666"
													: "1",
										}}
										className="card-image"
										onLoad={() =>
											setImgLoading(false)
										}
									></CardMedia>
								))}
						</div>
						{!!blurhash && (
							<Blurhash
								hash={blurhash}
								width="100%"
								height="100%"
								resolutionX={24}
								resolutionY={24}
								style={{
									aspectRatio:
										cardOrientation == "landscape"
											? "1.777"
											: cardOrientation ==
											  "portait"
											? "0.666"
											: "1",
								}}
								className="card-image-blurhash"
							/>
						)}
						<div className="card-image-icon-container">
							{cardType == "lib"
								? MediaCollectionTypeIconCollectionCard[
										iconType
								  ]
								: TypeIconCollectionCard[iconType]}
						</div>
						{!!playedPercent && (
							<LinearProgress
								variant="determinate"
								value={playedPercent}
								sx={{
									width: "90%",
									position: "absolute",
									left: "5%",
									bottom: "5%",
									borderRadius: "100px",
									height: "5px",
								}}
							/>
						)}
					</>
					<Box
						className="card-media-overlay"
						sx={{
							display: "flex",
							alignItems: "flex-end",
							justifyContent: "flex-end",
							p: 1,
						}}
					>
						<ButtonGroup>
							{availableMarkButtonTypes.includes(
								iconType,
							) && (
								<IconButton
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										handleMarkAsPlayOrUnMarkAsPlay();
									}}
									onFocus={(e) => e.stopPropagation}
								>
									<MdiCheck
										sx={{
											color: isWatched
												? green[400]
												: "white",
										}}
									/>
								</IconButton>
							)}
							{allowedLikeButton.includes(iconType) && (
								<IconButton
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										handleLiking();
									}}
									onFocus={(e) => e.stopPropagation}
								>
									{isFavorite ? (
										<MdiHeart
											sx={{ color: pink[700] }}
										/>
									) : (
										<MdiHeartOutline />
									)}
								</IconButton>
							)}
						</ButtonGroup>
					</Box>
				</Box>

				<CardContent
					className="card-text-container"
					sx={{
						padding: "0 0.5em",
						backgroundColor: "transparent",
					}}
				>
					<Typography
						gutterBottom={false}
						variant="h6"
						component="div"
						color="white"
						fontWeight={500}
						textAlign="left"
						noWrap
						width="fit-content"
						maxWidth="100%"
					>
						{itemName}
					</Typography>

					<Typography
						gutterBottom
						variant="subtitle1"
						component="div"
						textAlign="left"
						width="fit-content"
						maxWidth="100%"
						noWrap
						sx={{ opacity: 0.5 }}
					>
						{subText}
					</Typography>
				</CardContent>
			</CardActionArea>
		</MuiCard>
	);
};

Card.propTypes = {
	itemName: PropTypes.string.isRequired,
	itemId: PropTypes.string.isRequired,
	imageTags: PropTypes.bool,
	iconType: PropTypes.string.isRequired,
	cardType: PropTypes.string,
	subText: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	playedPercent: PropTypes.number,
	cardOrientation: PropTypes.string.isRequired,
	onClickEvent: PropTypes.func,
	watchedStatus: PropTypes.bool,
	watchedCount: PropTypes.number,
	blurhash: PropTypes.string,
	currentUser: PropTypes.object,
	favourite: PropTypes.bool,
};
