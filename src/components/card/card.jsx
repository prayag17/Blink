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

const cardImageAspectRatios = {
	thumb: 1.777,
	portrait: 0.666,
	square: 1,
};

export const Card = ({
	itemId,
	itemType,
	itemName,
	isFavorite,
	isPlayed,
	imageType = "Primary",
	imageBlurhash,
	cardType,
	secondaryText,
	queryKey,
	userId,

	onClick,
	disableOverlay = false,
}) => {
	const ref = useRef();
	const isVisible = useIntersecting(ref);
	const navigate = useNavigate();
	const defaultOnClick = () => navigate(`/item/${itemId}`);
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
						}}
					>
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
							{TypeIconCollectionCard[itemType]}
						</Box>
						<img
							src={window.api.getItemImageUrl(
								itemId,
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
								<LikeButton
									itemId={itemId}
									itemName={itemName}
									isFavorite={isFavorite}
									queryKey={queryKey}
									userId={userId}
								/>
								<MarkPlayedButton
									itemId={itemId}
									itemName={itemName}
									isPlayed={isPlayed}
									queryKey={queryKey}
									userId={userId}
								/>
							</Box>
						)}
					</Box>
					<Box className="card-text-container" height="15%">
						<Typography
							variant="h6"
							fontWeight={400}
							noWrap
							textAlign="center"
							sx={{ opacity: 0.9 }}
						>
							{itemName}
						</Typography>
						<Typography
							variant="subtitle1"
							fontWeight={300}
							noWrap
							textAlign="center"
							sx={{ opacity: 0.6 }}
						>
							{secondaryText}
						</Typography>
					</Box>
				</Stack>
			</MuiCard>
		</CardActionArea>
	);
};

Card.propTypes = {};
