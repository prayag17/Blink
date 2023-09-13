/** @format */

import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Divider from "@mui/material/Divider";

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
					<Skeleton
						width={320}
						variant="text"
						animation="wave"
					/>
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
			></div>
			{Array.from(new Array(4)).map((a, index) => {
				return (
					<Grid xs={1} sm={1} md={1} key={index}>
						<Card
							sx={{ background: "transparent" }}
							elevation={0}
						>
							<CardMedia>
								<Skeleton
									animation="wave"
									variant="rectangular"
									sx={{
										aspectRatio: "1.777",
										height: "auto",
										m: 1,
										borderRadius:
											borderRadiusDefault,
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
									<Skeleton
										variant="text"
										animation="wave"
									/>
								</Typography>

								<Typography variant="body2">
									<Skeleton
										variant="text"
										animation="wave"
									/>
									<Skeleton
										variant="text"
										animation="wave"
									/>

									<Skeleton
										variant="text"
										animation="wave"
									/>
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				);
			})}
		</Grid>
	);
};
