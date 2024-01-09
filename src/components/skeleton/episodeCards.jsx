import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";

import { borderRadiusDefault } from "../../palette.module.scss";

export const EpisodeCardsSkeleton = () => {
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
			{Array.from(new Array(4)).map((a) => {
				return (
					<Grid xs={1} sm={1} md={1} key={a}>
						<Card sx={{ background: "transparent" }} elevation={0}>
							<CardMedia>
								<Skeleton
									animation="wave"
									variant="rectangular"
									sx={{
										aspectRatio: "1.777",
										height: "auto",
										m: 1,
										borderRadius: borderRadiusDefault,
									}}
								/>
							</CardMedia>
							<CardContent
								sx={{
									padding: "0 0.5em",
									alignItems: "flex-start",
									backgroundColor: "transparent",
								}}
							>
								<Typography variant="h6">
									<Skeleton variant="text" animation="wave" />
								</Typography>

								<Typography variant="body2">
									<Skeleton variant="text" animation="wave" />
									<Skeleton variant="text" animation="wave" />

									<Skeleton variant="text" animation="wave" />
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				);
			})}
		</Grid>
	);
};
