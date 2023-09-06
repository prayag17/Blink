/** @format */
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { Card } from "../../card/card";
import { MdiStar } from "../../icons/mdiStar";
import { yellow } from "@mui/material/colors";
import { endsAt, getRuntime } from "../../../utils/date/time";
import LikeButton from "../../buttons/likeButton";
import MarkPlayedButton from "../../buttons/markPlayedButton";

const Hero = ({ item, queryKey, userId }) => {
	return (
		<div className="item-detail-hero">
			<div className="item-detail-primaryImage">
				<Card
					item={item}
					seriesId={item.SeriesId}
					imageType={"Primary"}
					cardType={
						item.Type == BaseItemKind.MusicAlbum ||
						item.Type == BaseItemKind.Audio
							? "square"
							: "portrait"
					}
					queryKey={queryKey}
					userId={userId}
					imageBlurhash={
						item.ImageBlurHashes?.Primary[
							Object.keys(item.ImageBlurHashes.Primary)[0]
						]
					}
					hideText
					disablePadding
				/>
			</div>
			<div className="item-detail-hero-info-container">
				<div>
					<div className="item-name">
						<Typography
							variant="h3"
							noWrap={true}
							fontWeight={600}
						>
							{item.Name}
						</Typography>
					</div>
					<Stack
						direction="row"
						gap={1}
						divider={
							<div
								style={{
									width: "4px",
									height: "4px",
									background: "white",
									alignSelf: "center",
									aspectRatio: 1,
									borderRadius: "10px",
								}}
							></div>
						}
						className="hero-carousel-info"
						mt={1}
					>
						<Typography
							style={{ opacity: "0.7" }}
							variant="subtitle1"
						>
							{!!item.ProductionYear
								? item.ProductionYear
								: "Unknown"}
						</Typography>
						<Chip
							variant="filled"
							label={item.OfficialRating ?? "Not Rated"}
						/>
						<div
							style={{
								display: "flex",
								gap: "0.25em",
								alignItems: "center",
							}}
							className="hero-carousel-info-rating"
						>
							{!!item.CommunityRating ? (
								<>
									<MdiStar
										sx={{
											color: yellow[700],
										}}
									/>
									<Typography
										style={{ opacity: "0.7" }}
										variant="subtitle1"
									>
										{Math.round(
											item.CommunityRating *
												10,
										) / 10}
									</Typography>
								</>
							) : (
								<Typography
									style={{ opacity: "0.7" }}
									variant="subtitle1"
								>
									No Community Rating
								</Typography>
							)}
						</div>
						{!!item.RunTimeTicks && (
							<Typography
								style={{ opacity: "0.7" }}
								variant="subtitle1"
							>
								{getRuntime(item.RunTimeTicks)}
							</Typography>
						)}
						{!!item.RunTimeTicks && (
							<Typography
								style={{ opacity: "0.7" }}
								variant="subtitle1"
							>
								{endsAt(item.RunTimeTicks)}
							</Typography>
						)}
					</Stack>
					<Typography
						style={{ opacity: "0.7" }}
						variant="subtitle1"
						mt={1}
					>
						{item.Genres.join(", ")}
					</Typography>
				</div>
				<div
					style={{
						margin: "2em 0",
					}}
					className="item-button-container"
				>
					<LikeButton
						queryKey={["item", item.Id]}
						itemId={item.Id}
						itemName={item.Name}
						isFavorite={item.UserData?.IsFavorite}
						userId={userId}
					/>
					<MarkPlayedButton
						queryKey={["item", item.Id]}
						itemId={item.Id}
						itemName={item.Name}
						isPlayed={item.UserData?.Played}
						userId={userId}
					/>
				</div>
				<div
					style={{
						marginTop: "1em",
					}}
				>
					<Typography variant="subtitle1">
						{item.Overview}
					</Typography>
				</div>
			</div>
		</div>
	);
};

export default Hero;
