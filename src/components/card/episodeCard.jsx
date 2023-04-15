/** @format */
import React, { useState } from "react";
import PropTypes from "prop-types";

import { useNavigate } from "react-router-dom";

import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
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
import { endsAt, getRuntime } from "../../utils/date/time";
import { MdiStarHalfFull } from "../icons/mdiStarHalfFull";

export const EpisodeCard = ({
	itemName,
	itemRating,
	itemTicks,
	itemId,
	imageTags,
	subText = "",
	playedPercent,
	cardProps,
	onClickEvent,
	watchedStatus,
	blurhash,
	currentUser,
	favourite,
	showName,
	episodeLocation,
}) => {
	const navigate = useNavigate();
	const [imgLoading, setImgLoading] = useState(true);
	const [isWatched, setIsWatched] = useState(watchedStatus);
	const [isFavourite, setIsFavourite] = useState(favourite);
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
		console.log(result.data);
		setIsWatched(result.data.Played);
	};
	const handleLiking = async () => {
		let result;
		if (isFavourite) {
			result = await getUserLibraryApi(window.api).unmarkFavoriteItem({
				userId: currentUser.Id,
				itemId: itemId,
			});
		} else if (!isFavourite) {
			result = await getUserLibraryApi(window.api).markFavoriteItem({
				userId: currentUser.Id,
				itemId: itemId,
			});
		}
		console.log(result.data.IsFavorite);
		setIsFavourite(result.data.IsFavorite);
	};

	return (
		<MuiCard
			className="card landscape"
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
				component="div"
				onClick={
					!!onClickEvent
						? onClickEvent
						: () => {
								navigate(`/item/${itemId}`);
						  }
				}
			>
				<Box
					className="card-media-container"
					sx={{
						position: "relative",
						m: 1,
						aspectRatio: "1.777",
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
						<div
							className="card-media-image-container"
							style={{ opacity: imgLoading ? 0 : 1 }}
						>
							{imageTags && (
								<CardMedia
									component="img"
									image={
										window.api.basePath +
										"/Items/" +
										itemId +
										"/Images/Primary?fillHeight=300&fillWidth=532&quality=96"
									}
									alt={itemName}
									sx={{
										width: "100%",
										aspectRatio: "1.777",
										borderRadius:
											borderRadiusDefault,
										overflow: "hidden",
									}}
									onLoad={() => setImgLoading(false)}
									className="card-image"
								></CardMedia>
							)}
						</div>
						{!!blurhash && (
							<Blurhash
								hash={blurhash}
								width="100%"
								height="100%"
								resolutionX={512}
								resolutionY={910}
								style={{
									aspectRatio: "1.777",
								}}
								className="card-image-blurhash"
							/>
						)}
						<div className="card-image-icon-container">
							{TypeIconCollectionCard["Episode"]}
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
								color="white"
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
							<IconButton
								onClick={(e) => {
									e.stopPropagation();
									handleMarkAsPlayOrUnMarkAsPlay();
								}}
							>
								<MdiCheck
									sx={{
										color: isWatched
											? green[200]
											: "white",
									}}
								/>
							</IconButton>
							<IconButton
								onClick={(e) => {
									e.stopPropagation();
									handleLiking();
								}}
							>
								{isFavourite ? (
									<MdiHeart
										sx={{ color: pink[700] }}
									/>
								) : (
									<MdiHeartOutline />
								)}
							</IconButton>
						</ButtonGroup>
					</Box>
				</Box>

				<CardContent
					className="card-text-container"
					sx={{
						padding: "0 0.5em",
						alignItems: "flex-start",
						backgroundColor: "transparent",
					}}
				>
					{!!showName && (
						<>
							<Typography
								gutterBottom={false}
								variant="h5"
								component="div"
								color="white"
								fontWeight={500}
								textAlign="left"
								noWrap
								width="fit-content"
								maxWidth="100%"
							>
								{`${showName} - ${episodeLocation}`}
							</Typography>
						</>
					)}
					<Box
						sx={{
							display: "flex",
							opacity: !!showName ? 0.75 : 1,
							justifyContent: "space-between",
							alignItems: "center",
						}}
						width="100%"
						mb={0.5}
						mt={0.5}
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
							gutterBottom={false}
							variant="h6"
							component="div"
							color="white"
							fontWeight={300}
							textAlign="left"
							noWrap
							width="fit-content"
							maxWidth="100%"
							sx={{
								opacity: 0.65,
							}}
						>
							{getRuntime(itemTicks)}
						</Typography>
					</Box>
					<Stack
						alignItems="flex-start"
						width="100%"
						direction="row"
						gap={1}
						divider={
							<Divider
								flexItem
								orientation="vertical"
								variant="middle"
							/>
						}
						mb={1}
					>
						<Typography
							gutterBottom={false}
							variant="subtitle1"
							component="div"
							color="white"
							fontWeight={300}
							textAlign="left"
							noWrap
							width="fit-content"
							maxWidth="100%"
							sx={{
								opacity: 0.65,
								display: "flex",
								alignItems: "center",
								justifyContent: "flex-start",
							}}
						>
							<MdiStarHalfFull
								sx={{ fontSize: "1.2em", mr: "0.25em" }}
							/>{" "}
							{itemRating}
						</Typography>
						<Typography
							gutterBottom={false}
							variant="subtitle1"
							component="div"
							color="white"
							fontWeight={300}
							textAlign="left"
							noWrap
							width="fit-content"
							maxWidth="100%"
							sx={{
								opacity: 0.65,
								display: "flex",
								alignItems: "center",
								justifyContent: "flex-start",
							}}
						>
							{endsAt(itemTicks)}
						</Typography>
					</Stack>
					<Typography
						gutterBottom
						variant="body2"
						component="div"
						color="white"
						textAlign="left"
						width="fit-content"
						maxWidth="100%"
						sx={{
							display: "-webkit-box",
							overflow: "hidden",
							WebkitBoxOrient: "vertical",
							WebkitLineClamp: 3,
							opacity: 0.45,
						}}
					>
						{subText}
					</Typography>
				</CardContent>
			</CardActionArea>
		</MuiCard>
	);
};

EpisodeCard.propTypes = {
	itemName: PropTypes.string.isRequired,
	itemId: PropTypes.string.isRequired,
	imageTags: PropTypes.bool,
	subText: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	playedPercent: PropTypes.number,
	onClickEvent: PropTypes.func,
	watchedStatus: PropTypes.bool,
	blurhash: PropTypes.string,
	currentUser: PropTypes.object,
	favourite: PropTypes.bool,
	showName: PropTypes.string,
	episodeLocation: PropTypes.string,
	itemTicks: PropTypes.number.isRequired,
	itemRating: PropTypes.number.isRequired,
};
