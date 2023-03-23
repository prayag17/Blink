/** @format */
import React from "react";
import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";

import {
	MediaCollectionTypeIconCollectionCard,
	MediaTypeIconCollectionCard,
} from "../utils/iconsCollection";

import "./card.module.scss";

export const CardLandscape = ({ itemName, itemId, imageTags, iconType }) => {
	return (
		<Card className="card landscape" elevation={10}>
			<CardActionArea>
				{imageTags ? (
					<CardMedia
						component="img"
						image={
							window.api.basePath +
							"/Items/" +
							itemId +
							"/Images/Primary"
						}
						alt={itemName}
						sx={{
							width: "100%",
							aspectRatio: 1.777,
						}}
						className="card-image-container"
					></CardMedia>
				) : (
					<CardMedia className="card-image-icon-container">
						{MediaCollectionTypeIconCollectionCard[iconType]}
					</CardMedia>
				)}

				<CardContent className="card-text-container">
					<Typography
						gutterBottom
						variant="button"
						component="div"
						color="white"
					>
						{itemName}
					</Typography>
				</CardContent>
			</CardActionArea>
		</Card>
	);
};

export const CardPotrait = ({ itemName, itemId, imageTags, iconType }) => {
	return (
		<div className="card portrait">
			<div className="card-image-container">
				{imageTags ? (
					<div
						className="card-image"
						style={{
							backgroundImage:
								"url('" +
								window.api.basePath +
								"/Items/" +
								itemId +
								"/Images/Primary?quality=95&fillHeight=350&fillWidth=243')",
						}}
					></div>
				) : (
					<div className="card-image empty"></div>
				)}
				<div className="card-image-icon-container">
					{MediaTypeIconCollectionCard[iconType]}
				</div>
			</div>

			<div className="card-text-container">
				<Typography variant="button" color="white">
					{itemName}
				</Typography>
			</div>
		</div>
	);
};

CardLandscape.propTypes = {
	itemName: PropTypes.string.isRequired,
	itemId: PropTypes.string.isRequired,
	imageTags: PropTypes.bool,
	iconType: PropTypes.string.isRequired,
};

CardPotrait.propTypes = {
	itemName: PropTypes.string.isRequired,
	itemId: PropTypes.string.isRequired,
	imageTags: PropTypes.bool,
	iconType: PropTypes.string.isRequired,
};
