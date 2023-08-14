/** @format */
import Skeleton from "@mui/material/Skeleton";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { theme } from "../../theme";
export const CarouselSkeleton = () => {
	return (
		<Paper
			className="hero-carousel-skeleton"
			elevation={0}
			sx={{
				height: "100vh",
				position: "relative",
				background: theme.palette.primary.background.main,
				borderRadius: 0,
			}}
		>
			<div className="hero-carousel-background">
				<Skeleton
					variant="rectangular"
					height="100%"
					animation="wave"
					sx={{
						width: "100vw",
						height: "100vh",
						position: "absolute",
					}}
				></Skeleton>
			</div>
			<Box className="hero-carousel-detail">
				<Typography variant="h3" className="hero-carousel-text">
					<Skeleton
						variant="text"
						sx={{ fontSize: "5rem" }}
						width={300}
						animation="wave"
					></Skeleton>
				</Typography>
				<Typography variant="p" className="hero-carousel-text">
					<Skeleton
						variant="text"
						sx={{ fontSize: "3rem" }}
						width={400}
						animation="wave"
					></Skeleton>
				</Typography>
			</Box>
		</Paper>
	);
};
