import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";

// import { BaseItemDto } from "";
// import { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { MediaStreamType } from "@jellyfin/sdk/lib/generated-client/models/media-stream-type";

import { red, yellow } from "@mui/material/colors";
import { endsAt, getRuntime, getRuntimeFull } from "../../../utils/date/time";
import LikeButton from "../../buttons/likeButton";
import MarkPlayedButton from "../../buttons/markPlayedButton";
import PlayButton from "../../buttons/playButton";
import { Card } from "../../card/card";

import { Blurhash } from "react-blurhash";
import TextLink from "../../textLink";
import "./hero.module.scss";

import { ErrorBoundary } from "react-error-boundary";
import { useApi } from "../../../utils/store/api";
/**
 * @typedef {Object} Props
 * @property {import("@jellyfin/sdk/lib/generated-client/models").BaseItemDto} item
 * @property {Array} queryKey
 * @property {string} userId
 * @property {import("@jellyfin/sdk/lib/generated-client/models").BaseItemPerson[]} writers
 * @property {import("@jellyfin/sdk/lib/generated-client/models").BaseItemPerson[]} directors
 * @property {import("@jellyfin/sdk/lib/generated-client/models").BaseItemPerson[]} artists
 * @property {import("@jellyfin/sdk/lib/generated-client/models").NameGuidPair[]} studios
 * @property {bool} disableInfoStrip
 * @property {bool} disablePlayButton
 * @property {bool} disableLikeButton
 * @property {bool} disableMarkAsPlayedButton
 * @property {string} albumBy
 * @property {bool} audioPlayButton
 * @property {bool} favourParentImg
 * @property {"portrait"| "thumb"| 'square'} cardType
 * @property {bool} enableVideoInfoStrip
 */

/**
 * @description Hero section for item pages
 * @param {Props}
 * @returns {React.Component}
 */
const Hero = ({
	item,
	queryKey,
	userId,
	writers = [],
	directors = [],
	artists = [],
	studios = [],
	disableInfoStrip,
	disablePlayButton,
	disableLikeButton,
	disableMarkAsPlayedButton,
	albumBy,
	audioPlayButton = false,
	favourParentImg = true,
	isEpisode = false,
	cardType = "portrait",
	enableVideoInfoStrip = false,
}) => {
	const [api] = useApi((state) => [state.api]);

	const filterMediaStreamVideo = (source) => {
		if (source.Type === MediaStreamType.Video) {
			return true;
		}
		return false;
	};
	const filterMediaStreamAudio = (source) => {
		if (source.Type === MediaStreamType.Audio) {
			return true;
		}
		return false;
	};
	const filterMediaStreamSubtitle = (source) => {
		if (source.Type === MediaStreamType.Subtitle) {
			return true;
		}
		return false;
	};

	const videoTracks = item.MediaStreams?.filter(filterMediaStreamVideo);
	const audioTracks = item.MediaStreams?.filter(filterMediaStreamAudio);
	const subtitleTracks = item.MediaStreams?.filter(filterMediaStreamSubtitle);

	const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
	const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
	const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);

	useEffect(() => {
		if (!!videoTracks && !!audioTracks & !!subtitleTracks) {
			setCurrentVideoIndex(videoTracks[0]?.Index);
			setCurrentAudioIndex(audioTracks[0]?.Index);
			setCurrentSubtitleIndex(subtitleTracks[0]?.Index);
		}
	}, []);

	const qualityLabel = () => {
		if (
			videoTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("2160p") ||
			videoTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("4k")
		) {
			return "4K";
		}
		if (
			videoTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("1080p") ||
			videoTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("hd")
		) {
			return "HD";
		}
		return "SD";
	};

	const atmosLabel = () => {
		if (
			audioTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("atmos") &&
			audioTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("truehd")
		) {
			return "TrueHD | Atmos";
		}
		if (audioTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("atmos")) {
			return "Atmos";
		}
		if (audioTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("truehd")) {
			return "TrueHD";
		}
		return "";
	};

	const surroundSoundLabel = () => {
		if (audioTracks[0]?.DisplayTitle.includes("7.1")) {
			return "7.1";
		}
		if (audioTracks[0].DisplayTitle.includes("5.1")) {
			return "5.1";
		}
		return "2.0";
	};

	return (
		<div
			className="item-detail-hero hero"
			style={{
				marginBottom: "2em",
			}}
		>
			<div className="hero-backdrop">
				{!!item.ImageBlurHashes.Backdrop && (
					<>
						{Object.keys(item.ImageBlurHashes.Backdrop).length !== 0 && (
							<Blurhash
								hash={
									item.ImageBlurHashes.Backdrop[
										Object.keys(item.ImageBlurHashes.Backdrop)[0]
									]
								}
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
								item.ParentBackdropItemId
									? `${api.basePath}/Items/${item.ParentBackdropItemId}/Images/Backdrop`
									: `${api.basePath}/Items/${item.Id}/Images/Backdrop`
							}
							style={{
								opacity: 0,
							}}
							onLoad={(e) => {
								e.target.style.opacity = 1;
							}}
							loading="eager"
						/>
					</>
				)}
				<div className="hero-backdrop-icon-container" />
			</div>
			<div
				className="item-detail-hero-info-container"
				style={{
					display: "flex",
					flexDirection: "column",
					width: "100%",
				}}
			>
				<div>
					<div className="item-name">
						{isEpisode ? (
							<>
								<TextLink
									variant="h2"
									location={`/series/${item.SeriesId}`}
									otherProps={{
										fontWeight: 300,
									}}
								>
									{item.ParentLogoImageTag ? (
										<img
											src={`${api.basePath}/Items/${item.SeriesId}/Images/Logo`}
											className="hero-name-logo"
											onLoad={(e) => {
												e.target.style.opacity = 1;
											}}
										/>
									) : (
										item.SeriesName
									)}
								</TextLink>
								<Typography variant="h3" fontWeight={300}>
									{`S${item.ParentIndexNumber}:E${item.IndexNumber} ${item.Name}`}
								</Typography>
							</>
						) : (
							<Typography variant="h2" fontWeight={300}>
								{item.ImageTags.Logo ? (
									<img
										src={
											item.SeriesId
												? `${api.basePath}/Items/${item.SeriesId}/Images/Logo`
												: `${api.basePath}/Items/${item.Id}/Images/Logo`
										}
										className="hero-name-logo"
										onLoad={(e) => {
											e.target.style.opacity = 1;
										}}
									/>
								) : (
									item.Name
								)}
							</Typography>
						)}
						{!!albumBy && (
							<TextLink
								variant="h6"
								location={`/artist/${albumBy.Id}`}
								otherProps={{
									fontWeight: 400,
									style: {
										opacity: 0.8,
									},
								}}
							>
								By {albumBy.Name}
							</TextLink>
						)}
					</div>
					{enableVideoInfoStrip && (
						<Stack direction="row" gap={1} mb={2} mt={2}>
							{!!qualityLabel() && (
								<Chip
									variant="filled"
									label={
										<Typography
											variant="caption"
											fontWeight={600}
											// fontFamily="JetBrains Mono Variable"
										>
											{qualityLabel()}
										</Typography>
									}
									sx={{
										borderRadius: "8px !important",
										"& .MuiChip-label": {
											fontSize: "2.2em",
										},
									}}
								/>
							)}
							{!!surroundSoundLabel() && (
								<Chip
									variant="filled"
									label={
										<Typography
											variant="caption"
											fontWeight={600}
											fontFamily="JetBrains Mono Variable"
										>
											{surroundSoundLabel()}
										</Typography>
									}
									sx={{
										borderRadius: "8px !important",
										"& .MuiChip-label": {
											fontSize: "2.2em",
										},
									}}
								/>
							)}
							{!!videoTracks[0]?.VideoRangeType && (
								<Chip
									variant="filled"
									label={
										<Typography
											variant="caption"
											fontWeight={600}
											fontFamily="JetBrains Mono Variable"
										>
											{videoTracks[0].VideoRangeType}
										</Typography>
									}
									sx={{
										borderRadius: "8px !important",
										"& .MuiChip-label": {
											fontSize: "2.2em",
										},
									}}
								/>
							)}
							{!!atmosLabel() && (
								<Chip
									variant="filled"
									label={
										<Typography
											variant="caption"
											fontWeight={600}
											fontFamily="JetBrains Mono Variable"
										>
											{atmosLabel()}
										</Typography>
									}
									sx={{
										borderRadius: "8px !important",
										"& .MuiChip-label": {
											fontSize: "2.2em",
										},
									}}
								/>
							)}
							{!!subtitleTracks.length > 0 && (
								<Chip
									variant="filled"
									label={
										<Typography
											variant="caption"
											fontWeight={600}
											fontFamily="JetBrains Mono Variable"
										>
											CC
										</Typography>
									}
									sx={{
										borderRadius: "8px !important",
										"& .MuiChip-label": {
											fontSize: "2.2em",
										},
									}}
								/>
							)}
						</Stack>
					)}
					{!disableInfoStrip && (
						<Stack
							direction="row"
							gap={2}
							className="hero-carousel-info"
							mt={1}
							justifyItems="flex-start"
							alignItems="center"
						>
							<Typography style={{ opacity: "0.8" }} variant="subtitle1">
								{item.ProductionYear ? item.ProductionYear : "Unknown"}
							</Typography>
							<Chip
								variant="filled"
								label={item.OfficialRating ?? "Not Rated"}
							/>
							<ErrorBoundary fallback>
								<div
									style={{
										display: "flex",
										gap: "0.25em",
										alignItems: "center",
									}}
									className="hero-carousel-info-rating"
								>
									<div
										className="material-symbols-rounded "
										style={{
											// fontSize: "2.2em",
											color: yellow[400],
											fontVariationSettings:
												'"FILL" 1, "wght" 300, "GRAD" 25, "opsz" 40',
										}}
									>
										star
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle1"
									>
										{Math.round(item.CommunityRating * 10) / 10}
									</Typography>
								</div>
							</ErrorBoundary>
							{Boolean(item.CriticRating) && (
								<div
									style={{
										display: "flex",
										gap: "0.25em",
										alignItems: "center",
									}}
									className="hero-carousel-info-rating"
								>
									<div
										className="material-symbols-rounded "
										style={{
											color: red[400],
											fontVariationSettings:
												'"FILL" 1, "wght" 300, "GRAD" 25, "opsz" 40',
										}}
									>
										thumb_up
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle1"
									>
										{item.CriticRating}
									</Typography>
								</div>
							)}

							{!!item.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle1">
									{getRuntime(item.RunTimeTicks)}
								</Typography>
							)}
							{!!item.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle1">
									{endsAt(item.RunTimeTicks)}
								</Typography>
							)}
						</Stack>
					)}
					<Typography style={{ opacity: "0.8" }} variant="subtitle1" mt={1}>
						{item.Genres.join(", ")}
					</Typography>
				</div>
				{item.UserData?.PlaybackPositionTicks > 0 && (
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
								item.RunTimeTicks - item.UserData.PlaybackPositionTicks,
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
					{!disablePlayButton && (
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
							audio={audioPlayButton}
							playlistItemId={item.Type === BaseItemKind.Playlist && item.Id}
						/>
					)}
					{!disableLikeButton && (
						<LikeButton
							queryKey={["item", item.Id]}
							itemId={item.Id}
							itemName={item.Name}
							isFavorite={item.UserData?.IsFavorite}
							userId={userId}
						/>
					)}
					{!disableMarkAsPlayedButton && (
						<MarkPlayedButton
							queryKey={["item", item.Id]}
							itemId={item.Id}
							itemName={item.Name}
							isPlayed={item.UserData?.Played}
							userId={userId}
						/>
					)}{" "}
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "0.4em",
						maxWidth: "60%",
					}}
				>
					{Boolean(videoTracks?.length) && (
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
								onChange={(e) => setCurrentVideoIndex(e.target.value)}
								SelectProps={{
									MenuProps: {
										disableScrollLock: true,
									},
								}}
							>
								{videoTracks.map((track) => {
									return (
										<MenuItem key={track.Index} value={track.Index}>
											{track.DisplayTitle}
										</MenuItem>
									);
								})}
							</TextField>
						</div>
					)}
					{Boolean(audioTracks?.length) && (
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
								onChange={(e) => setCurrentAudioIndex(e.target.value)}
								SelectProps={{
									MenuProps: {
										disableScrollLock: true,
									},
								}}
							>
								{audioTracks.map((track) => {
									return (
										<MenuItem key={track.Index} value={track.Index}>
											{track.DisplayTitle}
										</MenuItem>
									);
								})}
							</TextField>
						</div>
					)}
					{Boolean(subtitleTracks?.length) && (
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
								onChange={(e) => {
									console.log(e.target.value);
									setCurrentSubtitleIndex(e.target.value);
								}}
								SelectProps={{
									MenuProps: {
										disableScrollLock: true,
									},
								}}
							>
								{subtitleTracks.map((track) => {
									return (
										<MenuItem key={track.Index} value={track.Index}>
											{track.DisplayTitle}
										</MenuItem>
									);
								})}
							</TextField>
						</div>
					)}
				</div>
				<div
					style={{
						marginTop: "0.2em",
					}}
				>
					<Typography fontStyle="italic" variant="h5" mb={1} mt={1}>
						{item.Taglines[0]}
					</Typography>
					<Typography variant="subtitle1">{item.Overview}</Typography>
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
							<div className="hero-text-container">
								{writers.map((writer, index) => (
									<>
										<TextLink
											key={writer.Id}
											variant={"subtitle1"}
											location={`/person/${writer.Id}`}
										>
											{writer.Name}
										</TextLink>
										{index !== writers.length - 1 && (
											<span
												style={{
													whiteSpace: "pre",
												}}
											>
												,{" "}
											</span>
										)}
									</>
								))}
							</div>
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
							<div className="hero-text-container">
								{directors.map((director, index) => (
									<>
										<TextLink
											key={director.Id}
											variant={"subtitle1"}
											location={`/person/${director.Id}`}
										>
											{director.Name}
										</TextLink>
										{index !== directors.length - 1 && (
											<span
												style={{
													whiteSpace: "pre",
												}}
											>
												,{" "}
											</span>
										)}
									</>
								))}
							</div>
						</div>
					)}
					{artists.length > 0 && (
						<div
							className="hero-grid"
							style={{
								marginTop: "0.5em",
							}}
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
							<div className="hero-text-container">
								{artists.map((artist, index) => (
									<>
										<TextLink
											key={artist.Id}
											variant={"subtitle1"}
											location={`/artist/${artist.Id}`}
										>
											{artist.Name}
										</TextLink>
										{index !== artists.length - 1 && (
											<span
												style={{
													whiteSpace: "pre",
												}}
											>
												,{" "}
											</span>
										)}
									</>
								))}
							</div>
						</div>
					)}
					{studios.length > 0 && (
						<div
							className="hero-grid"
							style={{
								marginTop: "0.5em",
							}}
						>
							<Typography
								variant="subtitle1"
								style={{
									opacity: 0.6,
								}}
								noWrap
							>
								Studios
							</Typography>
							<Typography variant="subtitle1">
								{studios.map((studio) => studio.Name).join(", ")}
							</Typography>
						</div>
					)}
				</div>
			</div>
			<div className="item-detail-primaryImage">
				<Card
					item={item}
					seriesId={favourParentImg && item.SeriesId}
					imageType={"Primary"}
					cardType={cardType}
					queryKey={queryKey}
					userId={userId}
					imageBlurhash={
						!!item.ImageBlurHashes?.Primary &&
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
		</div>
	);
};

export default Hero;

Hero.defaultProps = {
	disableInfoStrip: false,
	disablePlayButton: false,
	disableLikeButton: false,
	disableMarkAsPlayedButton: false,
};
