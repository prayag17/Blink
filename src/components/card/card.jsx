/** @format */
import React from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import MuiCard from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";

import {
	MediaCollectionTypeIconCollectionCard,
	MediaTypeIconCollectionCard,
} from "../utils/iconsCollection";

import { borderRadiusDefault } from "../../palette.module.scss";
import "./card.module.scss";

export const Card = ({
	itemName,
	itemId,
	imageTags,
	iconType,
	cardType = "",
	subText = "",
	playedPercent,
	cardOrientation,
	props,
}) => {
	return (
		<MuiCard
			className={"card " + cardOrientation}
			sx={{
				background: "transparent",
				borderRadius: borderRadiusDefault,
				mr: 1,
			}}
			elevation={0}
			{...props}
		>
			<CardActionArea>
				<Box
					className="card-media-container"
					sx={{ position: "relative", m: 1 }}
				>
					{imageTags ? (
						cardType == "thumb" ? (
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
										cardOrientation == "landscape"
											? 1.777
											: 0.666,
								}}
								className="card-image"
							></CardMedia>
						) : (
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
									aspectRatio:
										cardOrientation == "landscape"
											? 1.777
											: 0.666,
								}}
								className="card-image"
							></CardMedia>
						)
					) : (
						<CardMedia className="card-image-icon-container">
							{cardType == "lib"
								? MediaCollectionTypeIconCollectionCard[
										iconType
								  ]
								: MediaTypeIconCollectionCard[iconType]}
						</CardMedia>
					)}
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
						textAlign="center"
					>
						{itemName}
					</Typography>
					<Typography
						gutterBottom
						variant="subtitle2"
						component="div"
						color="gray"
						textAlign="center"
						// textOverflow={}
						// fontSize="0.85em"
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
	subText: PropTypes.string || PropTypes.number,
	playedPercent: PropTypes.number,
	cardOrientation: PropTypes.string.isRequired,
};
