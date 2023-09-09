/** @format */
import { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";

import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { Card } from "../../card/card";
import { MdiStar } from "../../icons/mdiStar";
import { yellow } from "@mui/material/colors";
import { endsAt, getRuntime, getRuntimeFull } from "../../../utils/date/time";
import LikeButton from "../../buttons/likeButton";
import MarkPlayedButton from "../../buttons/markPlayedButton";
import PlayButton from "../../buttons/playButton";

import "./hero.module.scss";
import { Blurhash } from "react-blurhash";
import { MediaTypeIconCollection } from "../../utils/iconsCollection";

const Hero = ({
	item,
	queryKey,
	userId,
	writers = [],
	directors = [],
	artists = [],
	videoTracks = [],
	audioTracks = [],
	subtitleTracks = [],
}) => {
	const [currentVideoIndex, setCurrentVideoIndex] = useState("");
	const [currentAudioIndex, setCurrentAudioIndex] = useState("");
	const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState("");

	useEffect(() => {
		setCurrentVideoIndex(videoTracks[0]?.Index);
		setCurrentAudioIndex(audioTracks[0]?.Index);
		setCurrentSubtitleIndex(subtitleTracks[0]?.Index);
	}, [videoTracks, audioTracks, subtitleTracks]);
	return (
		<div
			className="item-detail-hero"
			style={{
				marginBottom: "2em",
			}}
		>
			<div className="hero-backdrop">
				{!!item.ImageBlurHashes.Backdrop && (
					<>
						{Object.keys(item.ImageBlurHashes.Backdrop)
							.length != 0 && (
							<Blurhash
								hash={
									item.ImageBlurHashes.Backdrop[
										Object.keys(
											item.ImageBlurHashes
												.Backdrop,
										)[0]
									]
								}
								// hash="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
								width="1080"
								height="720"
								resolutionX={64}
								resolutionY={96}
								className="hero-backdrop-blurhash"
								punch={1}
							/>
						)}
						<img
							className="hero-backdrop-image"
							src={
								!!item.ParentBackdropItemId
									? `${window.api.basePath}/Items/${item.ParentBackdropItemId}/Images/Backdrop`
									: `${window.api.basePath}/Items/${item.Id}/Images/Backdrop`
							}
							style={{
								opacity: 0,
							}}
							onLoad={(e) => (e.target.style.opacity = 1)}
							loading="eager"
						/>
					</>
				)}
				<div className="hero-backdrop-icon-container">
					{MediaTypeIconCollection[item.Type]}
				</div>
			</div>
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
					disableOverlay
					onClick={() => {}}
				/>
			</div>
			<div
				className="item-detail-hero-info-container"
				style={{
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div>
					<div
						className="item-name"
						style={{
							marginTop: "4em",
						}}
					>
						<Typography variant="h3" fontWeight={600}>
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
							style={{ opacity: "0.8" }}
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
										style={{ opacity: "0.8" }}
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
									style={{ opacity: "0.8" }}
									variant="subtitle1"
								>
									No Community Rating
								</Typography>
							)}
						</div>
						{!!item.RunTimeTicks && (
							<Typography
								style={{ opacity: "0.8" }}
								variant="subtitle1"
							>
								{getRuntime(item.RunTimeTicks)}
							</Typography>
						)}
						{!!item.RunTimeTicks && (
							<Typography
								style={{ opacity: "0.8" }}
								variant="subtitle1"
							>
								{endsAt(item.RunTimeTicks)}
							</Typography>
						)}
					</Stack>
					<Typography
						style={{ opacity: "0.8" }}
						variant="subtitle1"
						mt={1}
					>
						{item.Genres.join(", ")}
					</Typography>
				</div>
				{item.UserData?.PlayedPercentage > 0 && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.5em",
							margin: " 1em 0 0  0",
						}}
					>
						<LinearProgress
							variant="determinate"
							value={item.UserData?.PlayedPercentage}
							style={{
								width: "50%",
								borderRadius: "1em",
							}}
							color="white"
						/>
						<Typography variant="subtitle1" fontWeight={600}>
							{getRuntimeFull(
								item.RunTimeTicks -
									item.UserData
										.PlaybackPositionTicks,
							)}{" "}
							remaining
						</Typography>
					</div>
				)}
				<div
					style={{
						margin: "1em 0",
						display: "flex",
						alignItems: "center",
						gap: "1em",
					}}
					className="item-button-container"
				>
					<PlayButton
						itemId={item.Id}
						userId={userId}
						itemType={item.Type}
						currentVideoTrack={currentVideoIndex}
						currentAudioTrack={currentAudioIndex}
						currentSubTrack={currentSubtitleIndex}
						buttonProps={{
							size: "large",
						}}
						itemUserData={item.UserData}
					/>
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
						display: "flex",
						flexDirection: "column",
						gap: "0.4em",
						maxWidth: "60%",
					}}
				>
					<div className="hero-grid">
						<Typography
							variant="subtitle1"
							style={{
								opacity: 0.6,
							}}
							noWrap
						>
							Video
						</Typography>
						<TextField
							size="small"
							value={currentVideoIndex}
							select
							onChange={(e) =>
								setCurrentVideoIndex(e.target.value)
							}
							SelectProps={{
								MenuProps: {
									disableScrollLock: true,
								},
							}}
						>
							{videoTracks.map((track, index) => {
								return (
									<MenuItem
										key={track.Index}
										value={track.Index}
									>
										{track.DisplayTitle}
									</MenuItem>
								);
							})}
						</TextField>
					</div>
					<div className="hero-grid">
						<Typography
							variant="subtitle1"
							style={{
								opacity: 0.6,
							}}
							noWrap
						>
							Audio
						</Typography>
						<TextField
							size="small"
							value={currentAudioIndex}
							select
							onChange={(e) =>
								setCurrentAudioIndex(e.target.value)
							}
							SelectProps={{
								MenuProps: {
									disableScrollLock: true,
								},
							}}
						>
							{audioTracks.map((track, index) => {
								return (
									<MenuItem
										key={track.Index}
										value={track.Index}
									>
										{track.DisplayTitle}
									</MenuItem>
								);
							})}
						</TextField>
					</div>

					<div className="hero-grid">
						<Typography
							variant="subtitle1"
							style={{
								opacity: 0.6,
							}}
							noWrap
						>
							Subtitle
						</Typography>
						<TextField
							size="small"
							value={currentSubtitleIndex}
							select
							onChange={(e) =>
								setCurrentSubtitleIndex(e.target.value)
							}
							SelectProps={{
								MenuProps: {
									disableScrollLock: true,
								},
							}}
						>
							{subtitleTracks.map((track, index) => {
								return (
									<MenuItem
										key={track.Index}
										value={track.Index}
									>
										{track.DisplayTitle}
									</MenuItem>
								);
							})}
						</TextField>
					</div>
				</div>
				<div
					style={{
						marginTop: "0.2em",
					}}
				>
					<Typography fontStyle="italic" variant="h5" mb={1}>
						{item.Taglines[0]}
					</Typography>
					<Typography variant="subtitle1">
						{item.Overview}
					</Typography>
				</div>
				<div
					style={{
						marginTop: "2em",
						alignSelf: "flex-end",
						width: "100%",
					}}
				>
					{writers.length > 0 && (
						<div className="hero-grid">
							<Typography
								variant="subtitle1"
								style={{
									opacity: 0.6,
								}}
								noWrap
							>
								Written by
							</Typography>
							<Typography variant="subtitle1">
								{writers
									.map((writer) => writer.Name)
									.join(", ")}
							</Typography>
						</div>
					)}
					{directors.length > 0 && (
						<div
							style={{
								marginTop: "0.5em",
							}}
							className="hero-grid"
						>
							<Typography
								variant="subtitle1"
								style={{
									opacity: 0.6,
								}}
								noWrap
							>
								Directed by
							</Typography>
							<Typography variant="subtitle1">
								{directors
									.map((director) => director.Name)
									.join(", ")}
							</Typography>
						</div>
					)}
					{artists.length > 0 && (
						<div
							style={{
								display: "flex",
							}}
							className="hero-grid"
						>
							<Typography
								variant="subtitle1"
								style={{
									opacity: 0.6,
								}}
								noWrap
							>
								Artists
							</Typography>
							<Typography variant="subtitle1">
								{artists
									.map((director) => director.Name)
									.join(", ")}
							</Typography>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Hero;
