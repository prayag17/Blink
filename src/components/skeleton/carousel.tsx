import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import React from "react";
export const CarouselSkeleton = () => {
	return (
		<div
			className="hero-carousel hero-carousel-skeleton"
			style={{
				height: "70vh",
				position: "relative",
				width: "100vw",
				marginLeft: "-4.4em",
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
					variant="body1"
					className="hero-carousel-text"
					style={{
						display: "flex",
						flexDirection: "column",
						paddingBottom: "4.4em",
					}}
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
		</div>
	);
};
