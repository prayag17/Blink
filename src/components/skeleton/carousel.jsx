import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import React from "react";
import { theme } from "../../theme";
export const CarouselSkeleton = () => {
	return (
		<Paper
			className="hero-carousel-skeleton"
			elevation={0}
			sx={{
				height: "70vh",
				margin: "0.6em 1.6em 1.6em 1.6em",
				position: "relative",
				background: "black",
				border: "1px solid rgb(255 255 255 / 0.2)",
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
						// animation="wave"
					/>
				</Typography>
				<Typography
					variant="p"
					className="hero-carousel-text"
					style={{ display: "flex", flexDirection: "column" }}
				>
					<Skeleton
						variant="text"
						sx={{ fontSize: "2rem" }}
						width={400}
						// animation="wave"
					/>
					<Skeleton
						variant="text"
						sx={{ fontSize: "2rem" }}
						width={400}
						// animation="wave"
					/>
					<Skeleton
						variant="text"
						sx={{ fontSize: "2rem" }}
						width={400}
						// animation="wave"
					/>
				</Typography>
			</div>
		</Paper>
	);
};
