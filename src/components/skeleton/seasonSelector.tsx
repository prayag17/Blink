import Divider from "@mui/material/Divider";
import Grid2 from "@mui/material/Grid2";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import React from "react";
import EpisodeSkeleton from "./episode";

export const SeasonSelectorSkeleton = () => {
	return (
		<Grid2
			container
			columns={{
				xs: 2,
				sm: 3,
				md: 4,
			}}
			sx={{ width: "100%" }}
		>
			<div
				style={{
					display: "flex",
					gap: "1em",
					justifyContent: "space-between",
					width: "100%",
				}}
			>
				<Typography variant="h3">
					<Skeleton width={320} variant="text" animation="wave" />
				</Typography>
				<Skeleton animation="wave" height={64} width={128} />
			</div>
			<Divider
				style={{
					display: "block",
					width: "100%",
				}}
			/>
			<div
				style={{
					display: "flex",
					width: "100%",
					alignItems: "center",
					justifyContent: "space-between",
					paddingBottom: " 0.5em",
				}}
			/>
			<div className="item-detail-episode-container">
				<EpisodeSkeleton />
			</div>
		</Grid2>
	);
};
