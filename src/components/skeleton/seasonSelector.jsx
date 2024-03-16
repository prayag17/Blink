import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import EpisodeSkeleton from "./episode";

import { borderRadiusDefault } from "../../palette.module.scss";

export const SeasonSelectorSkeleton = () => {
	return (
		<Grid
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
				<EpisodeSkeleton/>
			</div>
		</Grid>
	);
};
