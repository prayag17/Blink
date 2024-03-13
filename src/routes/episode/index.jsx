import PropTypes from "prop-types";
import React, { useState, useLayoutEffect, useRef } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { green, red, yellow } from "@mui/material/colors";

import { Blurhash } from "react-blurhash";

import { Link, NavLink, useParams } from "react-router-dom";

import { motion, useScroll } from "framer-motion";
import useParallax from "../../utils/hooks/useParallax";

import {
	BaseItemKind,
	ItemFields,
	MediaStreamType,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { useQuery } from "@tanstack/react-query";

import { Card } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";
import Hero from "../../components/layouts/item/hero";

import LikeButton from "../../components/buttons/likeButton";
import MarkPlayedButton from "../../components/buttons/markPlayedButton";
import PlayButton from "../../components/buttons/playButton";
import TrailerButton from "../../components/buttons/trailerButton";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";
import ShowMoreText from "../../components/showMoreText";
import TextLink from "../../components/textLink";
import { getTypeIcon } from "../../components/utils/iconsCollection";
import { endsAt, getRuntime } from "../../utils/date/time";
import { useApi } from "../../utils/store/api";
import { useBackdropStore } from "../../utils/store/backdrop";
import "./episode.module.scss";

import dolbyIcon from "../../assets/icons/dolby.svg";
import IconLink from "../../components/iconLink";

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`full-width-tabpanel-${index}`}
			aria-labelledby={`full-width-tab-${index}`}
			{...other}
			style={{ marginTop: "1em" }}
		>
			{value === index && <Box>{children}</Box>}
		</div>
	);
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

const EpisodeTitlePage = () => {
	const { id } = useParams();
	const [api] = useApi((state) => [state.api]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
		enabled: Boolean(api),
	});

	const item = useQuery({
		queryKey: ["item", id],
		queryFn: async () => {
			const result = await getUserLibraryApi(api).getItem({
				userId: user.data.Id,
				itemId: id,
				fields: [ItemFields.Crew],
			});
			return result.data;
		},
		enabled: !!user.data,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const upcomingEpisodes = useQuery({
		queryKey: ["item", id, "episode", "upcomingEpisodes"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
				parentId: item.data.ParentId,
				startIndex: item.data.IndexNumber,
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type === BaseItemKind.Episode,
		networkMode: "always",
	});

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	const [videoTracks, setVideoTracks] = useState([]);
	const [audioTracks, setAudioTracks] = useState([]);
	const [subtitleTracks, setSubtitleTracks] = useState([]);

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

	const [selectedVideoTrack, setSelectedVideoTrack] = useState(null);
	const [selectedAudioTrack, setSelectedAudioTrack] = useState(null);
	const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState(null);

	useLayoutEffect(() => {
		if (item.isSuccess && !!item.data.MediaStreams) {
			const videos = item.data.MediaStreams.filter(filterMediaStreamVideo);
			const audios = item.data.MediaStreams.filter(filterMediaStreamAudio);
			const subs = item.data.MediaStreams.filter(filterMediaStreamSubtitle);

			setSelectedVideoTrack(videos[0]?.Index ?? null);
			setSelectedAudioTrack(audios[0]?.Index ?? null);
			setSelectedSubtitleTrack(subs[0]?.Index ?? null);

			setVideoTracks(videos);
			setAudioTracks(audios);
			setSubtitleTracks(subs);
		}
	}, [item.isSuccess, item.data?.MediaStreams]);

	const [directors, setDirectors] = useState([]);
	const [writers, setWriters] = useState([]);
	const [actors, setActors] = useState([]);
	const [producers, setProducers] = useState([]);

	useLayoutEffect(() => {
		if (item.isSuccess) {
			setAppBackdrop(
				item.data.Type === BaseItemKind.MusicAlbum ||
					item.data.Type === BaseItemKind.Episode
					? `${api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`
					: `${api.basePath}/Items/${item.data.Id}/Images/Backdrop`,
				item.data.Id,
			);
			const direTp = item.data.People.filter((itm) => itm.Type === "Director");
			setDirectors(direTp);
			const writeTp = item.data.People.filter((itm) => itm.Type === "Writer");
			setWriters(writeTp);
			const producerTp = item.data.People.filter(
				(itm) => itm.Type === "Producer",
			);
			setProducers(producerTp);
			const actorTp = item.data.People.filter((itm) => itm.Type === "Actor");
			setActors(actorTp);
		}
	}, [item.isSuccess]);

	const qualityLabel = () => {
		if (
			videoTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("2160p") ||
			videoTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("4k")
		) {
			return <span className="material-symbols-rounded">4k</span>;
		}

		if (
			videoTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("1080p") ||
			videoTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("hd")
		) {
			return <span className="material-symbols-rounded">full_hd</span>;
		}
		return <span className="material-symbols-rounded">hd</span>;
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
		if (
			audioTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("ddp") ||
			audioTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("digital+")
		) {
			return "Digital+";
		}
		if (audioTracks[0]?.DisplayTitle.toLocaleLowerCase().includes("dd")) {
			return "Digital";
		}
		return "";
	};

	const surroundSoundLabel = () => {
		if (audioTracks[0]?.DisplayTitle.includes("7.1")) {
			return "7.1";
		}
		if (audioTracks[0]?.DisplayTitle.includes("5.1")) {
			return "5.1";
		}

		return "2.0";
	};

	const pageRef = useRef(null);
	const { scrollYProgress } = useScroll({
		target: pageRef,
		offset: ["start start", "60vh start"],
	});
	const parallax = useParallax(scrollYProgress, 50);

	if (item.isPending) {
		return (
			<Box
				sx={{
					width: "100%",
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}
	if (item.isSuccess) {
		return (
			<motion.div
				key={id}
				initial={{
					opacity: 0,
				}}
				animate={{
					opacity: 1,
				}}
				transition={{
					duration: 0.25,
					ease: "easeInOut",
				}}
				className="scrollY padded-top flex flex-column item item-episode"
				ref={pageRef}
			>
				<div className="item-hero flex flex-row">
					<div className="item-hero-backdrop-container">
						{item.data.BackdropImageTags ? (
							<motion.img
								alt={item.data.Name}
								src={api.getItemImageUrl(
									item.data.ParentBackdropItemId,
									"Backdrop",
									{
										tag: item.data.ParentBackdropImageTags[0],
									},
								)}
								className="item-hero-backdrop"
								onLoad={(e) => {
									e.currentTarget.style.opacity = 1;
								}}
								style={{
									y: parallax,
								}}
							/>
						) : (
							<></>
						)}
					</div>
					<div
						className="item-hero-image-container"
						style={{
							aspectRatio: item.data.PrimaryImageAspectRatio ?? 1,
						}}
					>
						{Object.keys(item.data.ImageTags).includes("Primary") ? (
							<>
								<Blurhash
									hash={
										item.data.ImageBlurHashes.Primary[
											item.data.ImageTags.Primary
										]
									}
									className="item-hero-image-blurhash"
								/>
								<img
									alt={item.data.Name}
									src={api.getItemImageUrl(item.data.Id, "Primary", {
										quality: 90,
										tag: item.data.ImageTags.Primary,
									})}
									onLoad={(e) => {
										e.currentTarget.style.opacity = 1;
									}}
									className="item-hero-image"
								/>
							</>
						) : (
							<></>
						)}
					</div>
					<div className="item-hero-detail flex flex-column">
						<TextLink variant={"h2"} location={`/series/${item.data.SeriesId}`}>
							{item.data.ParentLogoItemId.length > 0 ? (
								<img
									alt={item.data.SeriesName}
									src={api.getItemImageUrl(item.data.ParentLogoItemId, "Logo", {
										quality: 90,
										fillWidth: 592,
										fillHeight: 592,
									})}
									onLoad={(e) => {
										e.currentTarget.style.opacity = 1;
									}}
									className="item-hero-logo"
								/>
							) : (
								item.data.SeriesName
							)}
						</TextLink>
						<Typography variant="h4">
							S{item.data.ParentIndexNumber ?? 0}:E
							{item.data.IndexNumber} {item.data.Name}
						</Typography>

						<Stack direction="row" gap={1}>
							{!!qualityLabel() && (
								<Chip
									variant="filled"
									label={qualityLabel()}
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
										<Typography variant="caption" fontWeight={600}>
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
										<Typography variant="caption" fontWeight={600}>
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
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												gap: "0.5em",
											}}
										>
											<img
												alt="Dolby"
												src={dolbyIcon}
												style={{
													height: "1.6em",
												}}
											/>
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
										// <Typography
										// 	variant="caption"
										// 	fontWeight={600}
										// 	fontFamily="JetBrains Mono Variable"
										// >
										// 	CC
										// </Typography>
										<span className="material-symbols-rounded">
											closed_caption
										</span>
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
						<Stack
							direction="row"
							gap={2}
							justifyItems="flex-start"
							alignItems="center"
						>
							<Typography style={{ opacity: "0.8" }} variant="subtitle1">
								{item.data.ProductionYear ?? ""}
							</Typography>
							{item.data.OfficialRating && (
								<Chip variant="filled" label={item.data.OfficialRating} />
							)}

							{item.data.CommunityRating && (
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
										{Math.round(item.data.CommunityRating * 10) / 10}
									</Typography>
								</div>
							)}
							{item.data.CriticRating && (
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
											color:
												item.data.CriticRating > 50 ? green[400] : red[400],
											fontVariationSettings:
												'"FILL" 1, "wght" 300, "GRAD" 25, "opsz" 40',
										}}
									>
										{item.data.CriticRating > 50 ? "thumb_up" : "thumb_down"}
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle1"
									>
										{item.data.CriticRating}
									</Typography>
								</div>
							)}

							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle1">
									{getRuntime(item.data.RunTimeTicks)}
								</Typography>
							)}
							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle1">
									{endsAt(
										item.data.RunTimeTicks -
											item.data.UserData.PlaybackPositionTicks,
									)}
								</Typography>
							)}
						</Stack>
						<Typography variant="subtitle1" style={{ opacity: 0.8 }}>
							{item.data.Genres.join(", ")}
						</Typography>

						<div className="item-hero-buttons-container flex flex-row">
							<div className="flex flex-row">
								<PlayButton
									itemId={item.data.Id}
									itemType={item.data.Type}
									itemUserData={item.data.UserData}
									currentVideoTrack={selectedVideoTrack}
									currentAudioTrack={selectedAudioTrack}
									currentSubTrack={selectedSubtitleTrack}
									userId={user.data.Id}
								/>
							</div>
							<div className="flex flex-row" style={{ gap: "1em" }}>
								<TrailerButton
									trailerItem={item.data.RemoteTrailers}
									disabled={item.data.RemoteTrailers?.length === 0}
								/>
								<LikeButton
									itemName={item.data.Name}
									itemId={item.data.Id}
									queryKey={["item", id]}
									isFavorite={item.data.UserData.IsFavorite}
									userId={user.data.Id}
								/>
								<MarkPlayedButton
									itemName={item.data.Name}
									itemId={item.data.Id}
									queryKey={["item", id]}
									isPlayed={item.data.UserData.Played}
									userId={user.data.Id}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className="item-detail">
					<div style={{ width: "100%" }}>
						{item.data.UserData.PlaybackPositionTicks > 0 && (
							<div
								style={{
									width: "40%",
									marginBottom: "1em",
								}}
							>
								<Typography>
									{getRuntime(
										item.data.RunTimeTicks -
											item.data.UserData.PlaybackPositionTicks,
									)}{" "}
									left
								</Typography>
								<LinearProgress
									color="white"
									variant="determinate"
									value={item.data.UserData.PlayedPercentage}
									style={{
										borderRadius: "10px",
									}}
								/>
							</div>
						)}
						<Typography variant="h5" fontStyle="italic" mb={1}>
							{item.data.Taglines[0] ?? ""}
						</Typography>
						<ShowMoreText
							content={item.data.Overview ?? ""}
							collapsedLines={4}
						/>
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
							<div className="hero-grid">
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
					</div>
					<Divider flexItem orientation="vertical" />
					<div
						style={{
							width: "100%",
						}}
					>
						{videoTracks.length > 0 && (
							<TextField
								label="Video"
								select
								style={{
									width: "100%",
									marginBottom: "1em",
								}}
								value={selectedVideoTrack}
								variant="filled"
								onChange={(e) => setSelectedVideoTrack(e.target.value)}
							>
								{videoTracks.map((track) => (
									<MenuItem key={track.Index} value={track.Index}>
										{track.DisplayTitle}
									</MenuItem>
								))}
							</TextField>
						)}
						{audioTracks.length > 0 && (
							<TextField
								label="Audio"
								select
								style={{
									width: "100%",
									marginBottom: "1em",
								}}
								value={selectedAudioTrack}
								variant="filled"
								onChange={(e) => setSelectedAudioTrack(e.target.value)}
							>
								{audioTracks.map((track) => (
									<MenuItem key={track.Index} value={track.Index}>
										{track.DisplayTitle}
									</MenuItem>
								))}
							</TextField>
						)}
						{subtitleTracks.length > 0 && (
							<TextField
								label="Subtitle"
								select
								style={{
									width: "100%",
								}}
								value={selectedSubtitleTrack}
								variant="filled"
								onChange={(e) => setSelectedSubtitleTrack(e.target.value)}
							>
								<MenuItem key={-1} value={-1}>
									No Subtitle
								</MenuItem>
								{subtitleTracks.map((track) => (
									<MenuItem key={track.Index} value={track.Index}>
										{track.DisplayTitle}
									</MenuItem>
								))}
							</TextField>
						)}
						<div
							style={{
								display: "flex",
								gap: "0.6em",
								alignSelf: "end",
								marginTop: "1em",
							}}
						>
							{item.data.ExternalUrls.map((url) => (
								<IconLink url={url.Url} name={url.Name} />
							))}
						</div>
					</div>
				</div>

				{upcomingEpisodes.isSuccess &&
					upcomingEpisodes.data.Items.length > 0 && (
						<CardScroller
							title="Upcoming Episodes"
							displayCards={4}
							disableDecoration
						>
							{upcomingEpisodes.data.Items.map((episode) => {
								return (
									<Card
										key={episode.Id}
										item={episode}
										cardTitle={episode.SeriesName}
										imageType="Primary"
										cardCaption={`S${episode.ParentIndexNumber}:E${episode.IndexNumber} - ${episode.Name}`}
										cardType="thumb"
										queryKey={["item", id, "episode", "upcomingEpisodes"]}
										userId={user.data.Id}
										imageBlurhash={
											!!episode.ImageBlurHashes?.Primary &&
											episode.ImageBlurHashes?.Primary[
												Object.keys(episode.ImageBlurHashes.Primary)[0]
											]
										}
									/>
								);
							})}
						</CardScroller>
					)}
				{item.data.People?.length > 0 && (
					<div className="item-detail-cast">
						<Typography variant="h5" mb={2}>
							Cast & Crew
						</Typography>
						{actors.length > 0 && (
							<div className="item-detail-cast-container">
								<Typography variant="h6">Actors</Typography>
								<div className="item-detail-cast-grid">
									{actors.map((actor) => (
										<NavLink
											className="item-detail-cast-card"
											key={actor.Id}
											to={`/person/${actor.Id}`}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name}
													src={api.getItemImageUrl(actor.Id, "Primary", {
														quality: 80,
														fillWidth: 200,
														fillHeight: 200,
													})}
													className="item-detail-cast-card-image"
												/>
											) : (
												<div className="item-detail-cast-card-icon">
													{getTypeIcon("Person")}
												</div>
											)}
											<div className="item-detail-cast-card-text">
												<Typography variant="subtitle1">
													{actor.Name}
												</Typography>
												<Typography
													variant="subtitle2"
													style={{
														opacity: 0.5,
													}}
												>
													{actor.Role}
												</Typography>
											</div>
										</NavLink>
									))}
								</div>
							</div>
						)}
						{writers.length > 0 && (
							<div className="item-detail-cast-container">
								<Typography variant="h6">Writers</Typography>
								<div className="item-detail-cast-grid">
									{writers.map((actor) => (
										<NavLink
											className="item-detail-cast-card"
											key={actor.Id}
											to={`/person/${actor.Id}`}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name}
													src={api.getItemImageUrl(actor.Id, "Primary", {
														quality: 80,
														fillWidth: 200,
														fillHeight: 200,
													})}
													className="item-detail-cast-card-image"
												/>
											) : (
												<div className="item-detail-cast-card-icon">
													{getTypeIcon("Person")}
												</div>
											)}
											<div className="item-detail-cast-card-text">
												<Typography variant="subtitle1">
													{actor.Name}
												</Typography>
												<Typography
													variant="subtitle2"
													style={{
														opacity: 0.5,
													}}
												>
													{actor.Role}
												</Typography>
											</div>
										</NavLink>
									))}
								</div>
							</div>
						)}
						{directors.length > 0 && (
							<div className="item-detail-cast-container">
								<Typography variant="h6">Directors</Typography>
								<div className="item-detail-cast-grid">
									{directors.map((actor) => (
										<NavLink
											className="item-detail-cast-card"
											to={`/person/${actor.Id}`}
											key={actor.Id}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name}
													src={api.getItemImageUrl(actor.Id, "Primary", {
														quality: 80,
														fillWidth: 200,
														fillHeight: 200,
													})}
													className="item-detail-cast-card-image"
												/>
											) : (
												<div className="item-detail-cast-card-icon">
													{getTypeIcon("Person")}
												</div>
											)}
											<div className="item-detail-cast-card-text">
												<Typography variant="subtitle1">
													{actor.Name}
												</Typography>
												<Typography
													variant="subtitle2"
													style={{
														opacity: 0.5,
													}}
												>
													{actor.Role}
												</Typography>
											</div>
										</NavLink>
									))}
								</div>
							</div>
						)}
						{producers.length > 0 && (
							<div className="item-detail-cast-container">
								<Typography variant="h6">Producers</Typography>
								<div className="item-detail-cast-grid">
									{producers.map((actor) => (
										<NavLink
											className="item-detail-cast-card"
											key={actor.Id}
											to={`/person/${actor.Id}`}
										>
											{actor.PrimaryImageTag ? (
												<img
													alt={actor.Name}
													src={api.getItemImageUrl(actor.Id, "Primary", {
														quality: 80,
														fillWidth: 200,
														fillHeight: 200,
													})}
													className="item-detail-cast-card-image"
												/>
											) : (
												<div className="item-detail-cast-card-icon">
													{getTypeIcon("Person")}
												</div>
											)}
											<div className="item-detail-cast-card-text">
												<Typography variant="subtitle1">
													{actor.Name}
												</Typography>
												<Typography
													variant="subtitle2"
													style={{
														opacity: 0.5,
													}}
												>
													{actor.Role}
												</Typography>
											</div>
										</NavLink>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</motion.div>
		);
	}
	if (item.isError) {
		return <ErrorNotice />;
	}
};

export default EpisodeTitlePage;
