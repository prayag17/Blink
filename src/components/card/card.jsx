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
	const imageAvailable = () => {
		if (imageTags == {}) {
			return false;
		} else {
			console.log("hee");
			return true;
		}
	};
	console.log(!!imageTags.Primary);
	return (
		<Card className="card landscape">
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
						// alt={MediaCollectionTypeIconCollectionCard[iconType]}
						alt={itemName}
						className="card-image-container"
					></CardMedia>
				) : (
					<CardMedia className="card-image-container">
						{MediaCollectionTypeIconCollectionCard[iconType]}
					</CardMedia>
				)}

				<div className="card-text-container">
					<Typography variant="button" color="white">
						{itemName}
					</Typography>
				</div>
			</CardActionArea>
		</Card>
	);
};

export const CardPotrait = ({ itemName, itemId, imageTags, iconType }) => {
	const imageAvailable = () => {
		console.log(imageTags);
		if (imageTags == undefined) {
			console.log("hee");
			return false;
		} else {
			return true;
		}
	};
	return (
		<div className="card portrait">
			<div className="card-image-container">
				{imageAvailable ? (
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
	imageTags: PropTypes.object,
	iconType: PropTypes.string.isRequired,
};

CardPotrait.propTypes = {
	itemName: PropTypes.string.isRequired,
	itemId: PropTypes.string.isRequired,
	imageTags: PropTypes.object,
	iconType: PropTypes.string.isRequired,
};
