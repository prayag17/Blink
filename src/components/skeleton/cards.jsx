/** @format */

import Skeleton from "@mui/material/Skeleton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export const CardsSkeleton = () => {
	return (
		<div
			style={{
				display: "flex",
				flexFlow: "column",
				marginBottom: "2em",
			}}
		>
			<Typography variant="h4" sx={{ mb: "0.15em" }}>
				<Skeleton width="35%" animation="wave" />
			</Typography>
			<Skeleton width="100%" variant="rounded" animation="wave">
				<div style={{ paddingTop: "20%" }}></div>
			</Skeleton>
		</div>
	);
};
