import React from "react";

import { Divider, LinearProgress, Skeleton } from "@mui/material";

const ItemSkeleton = () => {
	return (
		<div
			className="item item-default scrollY padded-top flex flex-column"
			style={{
				width: "100vw",
			}}
		>
			<div
				className="item-hero flex flex-row"
				style={{
					height: "50vh",
				}}
			>
				<div
					className="item-hero-image-container"
					style={{
						aspectRatio: 0.6666,
						boxShadow: "0 0 black",
					}}
				>
					<Skeleton
						variant="rounded"
						style={{
							height: "50vh",
						}}
					/>
				</div>
				<div
					className="item-hero-detail flex flex-column"
					style={
						{
							// width: "50vw",
						}
					}
				>
					<Skeleton variant="text" sx={{ fontSize: "4rem" }} width="50%" />
					{/* </Typography> */}

					<div
						className="item-hero-buttons-container flex flex-row"
						style={{
							width: "70%",
							gap: "1em",
							justifyContent: "flex-start",
						}}
					>
						<Skeleton
							width="10rem"
							height="3rem"
							sx={{
								fontSize: "3rem",
								borderRadius: "3em",
								transform: "scale(1)",
							}}
						/>
						<div className="flex flex-row" style={{ gap: "1em" }}>
							<Skeleton
								width="3rem"
								height="3rem"
								sx={{
									fontSize: "3rem",
									borderRadius: "3em",
									transform: "scale(1)",
									aspectRatio: "1",
								}}
							/>
							<Skeleton
								width="3rem"
								height="3rem"
								sx={{
									fontSize: "3rem",
									borderRadius: "3em",
									transform: "scale(1)",
									aspectRatio: "1",
								}}
							/>
						</div>
					</div>
				</div>
			</div>
			<div className="item-detail">
				<div style={{ width: "100%" }}>
					<Skeleton variant="text" />
					<Skeleton variant="text" />
					<Skeleton variant="text" />
				</div>
				<Divider flexItem orientation="vertical" />
				<div
					style={{
						width: "100%",
					}}
				>
					<Skeleton
						variant="rounded"
						sx={{
							fontSize: "2.4rem",
							mb: 1,
						}}
					/>
					<Skeleton
						variant="rounded"
						sx={{
							fontSize: "2.4rem",
							mb: 1,
						}}
					/>
					<Skeleton
						variant="rounded"
						sx={{
							fontSize: "2.4rem",
						}}
					/>
				</div>
			</div>
		</div>
	);
};

export default ItemSkeleton;
