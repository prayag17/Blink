/** @format */
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";

import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
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
import useIntersecting from "../../utils/hooks/useIntersecting";

export const Card = ({
	itemId,
	itemParentId,
	itemName,
	imageTags,
	imageType = "Primary",
	parentImageType,
	imageAspectRatio,
}) => {
	const ref = useRef();
	const isVisible = useIntersecting(ref);
	return (
		<Box mr={2} ref={ref} sx={{ height: "100%", overflow: "visible" }}>
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
						aspectRatio: imageAspectRatio,
						overflow: "hidden",
					}}
					height="85%"
				>
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
						}}
						className="card-image"
					/>
				</Box>
				<Box className="card-text-container" height="15%">
					<Typography
						variant="h5"
						fontWeight={300}
						noWrap
						textAlign="center"
					>
						{itemName}
					</Typography>
				</Box>
			</Stack>
		</Box>
	);
};

Card.propTypes = {};
