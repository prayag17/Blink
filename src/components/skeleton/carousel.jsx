import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
/** @format */
import React from "react";
import { theme } from "../../theme";
export const CarouselSkeleton = () => {
	return (
		<Paper
			className="hero-carousel-skeleton"
			elevation={0}
			sx={{
				height: "70vh",
				margin: "4.4em 1.6em 1.6em 1.6em",
				position: "relative",
				background: theme.palette.primary.background.main,
				borderRadius: "10px",
				overflow: "hidden",
			}}
		>
			<div className="hero-carousel-detail">
				<Typography variant="h3" className="hero-carousel-text">
					<Skeleton
						variant="text"
						sx={{ fontSize: "8rem" }}
						width={300}
						animation="wave"
					/>
				</Typography>
				<Typography variant="p" className="hero-carousel-text">
					<Skeleton
						variant="text"
						sx={{ fontSize: "3rem" }}
						width={400}
						animation="wave"
					/>
				</Typography>
				<Typography variant="p" className="hero-carousel-text">
					<Skeleton
						variant="text"
						sx={{ fontSize: "3rem" }}
						width={400}
						animation="wave"
					/>
				</Typography>
			</div>
		</Paper>
	);
};
