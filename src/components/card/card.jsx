/** @format */
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";

import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
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
import useIntersecting from "../../utils/hooks/useIntersecting";
import LikeButton from "../buttons/likeButton";
import MarkPlayedButton from "../buttons/markPlayedButton";
import PlayButton from "../buttons/playButton";

const cardImageAspectRatios = {
	thumb: 1.777,
	portrait: 0.666,
	square: 1,
};

export const Card = ({
	item,
	cardTitle,
	cardCaption,
	imageType = "Primary",
	imageBlurhash,
	cardType,
	queryKey,
	userId,
	availableImagesTypes,
	seriesId,

	onClick,
	disableOverlay = false,
}) => {
	const ref = useRef();
	const isVisible = useIntersecting(ref);
	const navigate = useNavigate();
	const defaultOnClick = () => navigate(`/item/${item.Id}`);
	return (
		<CardActionArea
			sx={{ padding: 1, borderRadius: "10px" }}
			className="card-container"
			onClick={!!onClick ? onClick : defaultOnClick}
		>
			<MuiCard
				ref={ref}
				sx={{
					height: "100%",
					overflow: "visible",
					alignItems: "flex-start",
					background: "transparent",
				}}
				elevation={0}
			>
				<Stack
					className={isVisible ? "card isVisible" : "card"}
					sx={{
						width: "100%",
						height: "100%",
						position: "relative",
						overflow: "visible",
					}}
					direction="column"
					justifyContent="center"
					mr={1}
				>
					<Box
						className="card-image-container"
						sx={{
							aspectRatio: cardImageAspectRatios[cardType],
							overflow: "hidden",
							height: "auto",
							width: "100%",
							zIndex: 0,
						}}
					>
						{!!item.UserData && (
							<>
								<Box
									sx={{
										position: "absolute",
										top: "0.4em",
										right: "0.4em",
										zIndex: 2,
										background:
											"rgb(20 20 20 / 0.5)",
										padding: "0.2em 0.75em",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										borderRadius: "100px",
										backdropFilter: "blur(5px)",
										transition: "opacity 250ms",
										opacity: item.UserData?.Played
											? 1
											: 0,
										boxShadow:
											"0 0 5px rgb(0 0 0 / 0.2)",
									}}
								>
									<MdiCheck />
								</Box>
								<Box
									sx={{
										position: "absolute",
										top: "0.4em",
										right: "0.4em",
										zIndex: 2,
										background:
											"rgb(20 20 20 / 0.5)",
										padding: "0.2em 0.75em",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										borderRadius: "100px",
										backdropFilter: "blur(5px)",
										transition: "opacity 250ms",
										opacity: item.UserData
											?.UnplayedItemCount
											? 1
											: 0,
										boxShadow:
											"0 0 5px rgb(0 0 0 / 0.2)",
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
								</Box>
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
						<Box className="card-image-icon-container">
							{TypeIconCollectionCard[item.Type]}
						</Box>
						<img
							src={window.api.getItemImageUrl(
								!!seriesId ? item.SeriesId : item.Id,
								imageType,
								{
									quality: 90,
									fillHeight: 512,
									fillWidth: 512,
								},
							)}
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
							<Box className="card-overlay">
								<PlayButton
									itemId={item.Id}
									userId={userId}
									itemType={item.Type}
									currentAudioTrack={0}
									currentSubTrack={0}
									currentVideoTrack={0}
									className="card-play-button"
									iconProps={{
										sx: { fontSize: "1.5em" },
									}}
									iconOnly
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
									isPlayed={item.UserData.Played}
									queryKey={queryKey}
									userId={userId}
								/>
							</Box>
						)}
						{Boolean(item.UserData?.PlayedPercentage) && (
							<LinearProgress
								variant="determinate"
								value={item.UserData.PlayedPercentage}
								sx={{
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
					</Box>
					<Box className="card-text-container" height="15%">
						<Typography
							variant="subtitle1"
							fontWeight={500}
							noWrap
							textAlign="center"
							sx={{ opacity: 0.9 }}
						>
							{cardTitle}
						</Typography>
						<Typography
							variant="subtitle2"
							noWrap
							textAlign="center"
							sx={{ opacity: 0.6 }}
							lineHeight="auto"
						>
							{cardCaption}
						</Typography>
					</Box>
				</Stack>
			</MuiCard>
		</CardActionArea>
	);
};

Card.propTypes = {};
