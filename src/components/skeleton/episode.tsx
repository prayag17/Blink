import { Divider, Skeleton, Typography } from "@mui/material";
import React from "react";

const EpisodeSkeleton = () => {
    return Array.from(new Array(8)).map((_, index) => {
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: this is a skeleton
							key={index}
							style={{
								width: "100%",
							}}
						>
							<div className="item-detail-episode">
								<Typography variant="h6">
									<Skeleton
										variant="circular"
										sx={{
											animationDelay: `${index * 0.25}s`,
											animationDuration: "1.4s",
											animationName: "pulse",
											opacity: 0.1,
											aspectRatio: 1,
											width: "3rem",
											height: "3rem",
										}}
									/>
								</Typography>
								<div className="item-detail-episode-image-container">
									<Skeleton
										className="item-detail-episode-image"
										variant="rectangular"
										sx={{
											animationDelay: `${index * 0.2}s`,
											animationDuration: "1.4s",
											animationName: "pulse",
											opacity: 0.1,
										}}
									/>
								</div>
								<div className="item-detail-episode-info">
									<Typography variant="h4">
										<Skeleton
											variant="text"
											width="10em"
											sx={{
												animationDelay: `${index * 0.2}s`,
												animationDuration: "1.4s",
												animationName: "pulse",
												opacity: 0.1,
											}}
										/>
									</Typography>
									<Skeleton
										variant="rounded"
										width="5em"
										style={{ borderRadius: "100px" }}
										sx={{
											animationDelay: `${index * 0.2}s`,
											animationDuration: "1.4s",
											animationName: "pulse",
											opacity: 0.1,
										}}
									/>
									<Typography
										style={{
											width: "100%",
										}}
									>
										<Skeleton
											width="100%"
											sx={{
												animationDelay: `${index * 0.2}s`,
												animationDuration: "1.4s",
												animationName: "pulse",
												opacity: 0.1,
											}}
										/>
										<Skeleton
											width="100%"
											sx={{
												animationDelay: `${index * 0.2}s`,
												animationDuration: "1.4s",
												animationName: "pulse",
												opacity: 0.1,
											}}
										/>
									</Typography>
								</div>
							</div>
							{index !== 7 && <Divider orientation="horizontal" flexItem />}
						</div>
					);
				});
}

export default EpisodeSkeleton