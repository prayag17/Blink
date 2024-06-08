import PropTypes from "prop-types";
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";

import Box from "@mui/material/Box";
import MuiCard from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { green, red, yellow } from "@mui/material/colors";

import useParallax from "@/utils/hooks/useParallax";
import { AnimatePresence, motion, useScroll } from "framer-motion";

import { Blurhash } from "react-blurhash";

import {
	BaseItemKind,
	ItemFields,
	LocationType,
} from "@jellyfin/sdk/lib/generated-client";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { useQuery } from "@tanstack/react-query";

import {
	endsAt,
	getRuntime,
	getRuntimeCompact,
	getRuntimeMusic,
} from "@/utils/date/time";

import { Card } from "@/components/card/card";
import { EpisodeCard } from "@/components/card/episodeCard";
import { CardScroller } from "@/components/cardScroller/cardScroller";

import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import "./series.scss";

import heroBg from "@/assets/herobg.png";
import LikeButton from "@/components/buttons/likeButton";
import MarkPlayedButton from "@/components/buttons/markPlayedButton";
import PlayButton from "@/components/buttons/playButton";
import TrailerButton from "@/components/buttons/trailerButton";
import ShowMoreText from "@/components/showMoreText";
import { SeasonSelectorSkeleton } from "@/components/skeleton/seasonSelector";
import { getTypeIcon } from "@/components/utils/iconsCollection";
import { setBackdrop, useBackdropStore } from "@/utils/store/backdrop";

import IconLink from "@/components/iconLink";
import EpisodeSkeleton from "@/components/skeleton/episode";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

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

const getEpisodeDateString = (date: Date) => {
	const formatter = new Intl.DateTimeFormat(navigator.language ?? "en-US", {
		dateStyle: "full",
	});
	return formatter.format(date).toString();
};

export const Route = createFileRoute("/_api/series/$id")({
	component: SeriesTitlePage,
});

function SeriesTitlePage() {
	const { id } = Route.useParams();

	const api = Route.useRouteContext().api;

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

	const similarItems = useQuery({
		queryKey: ["item", id, "similarItem"],
		queryFn: async () => {
			const result = await getLibraryApi(api).getSimilarShows({
				userId: user.data.Id,
				itemId: item.data.Id,
				limit: 16,
			});
			return result.data;
		},
		enabled: item.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const seasons = useQuery({
		queryKey: ["item", id, "seasons"],
		queryFn: async () => {
			const result = await getTvShowsApi(api).getSeasons({
				userId: user.data.Id,
				seriesId: item.data.Id,
				// isSpecialSeason: false,
			});
			return result.data;
		},
		enabled: item.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const nextUpEpisode = useQuery({
		queryKey: ["item", id, "nextUp"],
		queryFn: async () => {
			const result = await getTvShowsApi(api).getNextUp({
				userId: user.data.Id,
				limit: 1,
				parentId: item.data.Id,
				disableFirstEpisode: true,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type === "Series",
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const [backdropImage, setBackdropImage] = useState<SeriesBackdropImage>(() => {
		const url = sessionStorage.getItem(`backdrop-${item.data?.Id}`);
		const key = sessionStorage.getItem(`backdrop-${item.data?.Id}-key`);
		return { url, key };
	});
	const [backdropImageLoaded, setBackdropImageLoaded] = useState(false);

	const [currentSeason, setCurrentSeason] = useState(() => {
		const result = sessionStorage.getItem(`season-${item.data?.Id}`);
		return result ?? 0;
	});

	const currentSeasonItem = useQuery({
		queryKey: ["item", id, "season", currentSeason],
		queryFn: async () => {
			const result = await getUserLibraryApi(api).getItem({
				userId: user.data.Id,
				itemId: seasons.data.Items[currentSeason].Id,
			});
			return result.data;
		},
		enabled: seasons.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const episodes = useQuery({
		queryKey: ["item", id, `season ${currentSeason + 1}`, "episodes"],
		queryFn: async () => {
			const result = await getTvShowsApi(api).getEpisodes({
				userId: user.data.Id,
				seriesId: item.data.Id,
				seasonId: seasons.data.Items[currentSeason].Id,
				fields: [ItemFields.Overview],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		enabled: seasons.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const specialFeatures = useQuery({
		queryKey: ["item", id, "specialFeatures"],
		queryFn: async () => {
			const result = await getUserLibraryApi(api).getSpecialFeatures({
				itemId: item.data.Id,
				userId: user.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess,
	});

	const [directors, setDirectors] = useState([]);
	const [writers, setWriters] = useState([]);
	const [actors, setActors] = useState([]);
	const [producers, setProducers] = useState([]);

	useLayoutEffect(() => {
		if (item.isSuccess) {
			// setBackdropImage({
			// 	url: api.getItemImageUrl(item.data?.Id, "Backdrop", {
			// 		tag: item.data?.BackdropImageTags[0],
			// 	}),
			// 	key: item.data?.BackdropImageTags[0],
			// });
			// setBackdrop(
			// 	api.getItemImageUrl(item.data?.Id, "Backdrop", {
			// 		tag: item.data?.BackdropImageTags[0],
			// 	}),
			// 	item.data.Id,
			// );
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

	useLayoutEffect(() => {
		if (
			seasons.isSuccess &&
			!sessionStorage.getItem(`season-${item.data?.Id}`)
		) {
			if (
				seasons.data.TotalRecordCount > 1 &&
				seasons.data.Items[0].Name.toLowerCase().includes("special")
			) {
				setCurrentSeason(1);
			} else {
				setCurrentSeason(0);
			}
		}
	}, [seasons.isSuccess]);

	useEffect(() => {
		if (
			currentSeasonItem.isSuccess &&
			currentSeasonItem.data?.BackdropImageTags?.length > 0
		) {
			sessionStorage.setItem(
				`backdrop-${item.data?.Id}`,
				api.getItemImageUrl(currentSeasonItem.data.Id, "Backdrop", {
					tag: currentSeasonItem.data.BackdropImageTags[0],
				}),
			);
			sessionStorage.setItem(
				`backdrop-${item.data?.Id}-key`,
				currentSeasonItem.data.BackdropImageTags[0],
			);
			setBackdropImage({
				url: api.getItemImageUrl(item.data?.Id, "Backdrop", {
					tag: item.data?.BackdropImageTags[0],
				}),
				key: item.data?.BackdropImageTags[0],
			});
			setBackdrop(
				api.getItemImageUrl(currentSeasonItem.data.Id, "Backdrop", {
					tag: currentSeasonItem.data.BackdropImageTags[0],
				}),
				currentSeasonItem.data.Id,
			);
			setBackdropImageLoaded(false);
		} else if (item.isSuccess && item.data?.BackdropImageTags?.length > 0) {
			sessionStorage.setItem(
				`backdrop-${item.data?.Id}`,
				api.getItemImageUrl(item.data.Id, "Backdrop", {
					tag: item.data.BackdropImageTags[0],
				}),
			);
			sessionStorage.setItem(
				`backdrop-${item.data?.Id}-key`,
				currentSeasonItem.data.BackdropImageTags[0],
			);
			setBackdropImage({
				url: api.getItemImageUrl(item.data?.Id, "Backdrop", {
					tag: item.data?.BackdropImageTags[0],
				}),
				key: item.data?.BackdropImageTags[0],
			});
			setBackdrop(
				api.getItemImageUrl(item.data.Id, "Backdrop", {
					tag: item.data.BackdropImageTags[0],
				}),
				item.data.Id,
			);
			setBackdropImageLoaded(false);
		}
	}, [currentSeasonItem.dataUpdatedAt]);

	const pageRef = useRef(null);
	const { scrollYProgress } = useScroll({
		target: pageRef,
		offset: ["start start", "60vh start"],
	});
	const parallax = useParallax(scrollYProgress, 50);

	const navigate = useNavigate();

	if (item.isPending || similarItems.isPending) {
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

	if (item.isSuccess && similarItems.isSuccess) {
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
				className="scrollY padded-top flex flex-column item item-series"
				ref={pageRef}
			>
				<div className="item-hero">
					<div className="item-hero-backdrop-container">
						<AnimatePresence mode="wait">
							{item.data.BackdropImageTags ? (
								<motion.img
									key={backdropImage.key}
									alt={item.data.Name}
									src={backdropImage.url}
									className="item-hero-backdrop"
									initial={{
										opacity: 0,
									}}
									onLoad={() => {
										setBackdropImageLoaded(true);
									}}
									animate={{
										opacity: backdropImageLoaded ? 1 : 0,
									}}
									exit={{
										opacity: 0,
									}}
									transition={{
										duration: 0.2,
									}}
									style={{
										y: parallax,
									}}
								/>
							) : (
								<motion.img
									alt={item.data.Name}
									src={heroBg}
									className="item-hero-backdrop"
									onLoad={(e) => {
										e.currentTarget.style.opacity = 1;
									}}
									style={{
										y: parallax,
									}}
								/>
							)}
						</AnimatePresence>
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
							<div className="item-hero-image-icon">
								{getTypeIcon(item.data.Type)}
							</div>
						)}
					</div>
					<div className="item-hero-detail">
						{Object.keys(item.data.ImageTags).includes("Logo") ? (
							<img
								alt={item.data.Name}
								src={api.getItemImageUrl(item.data.Id, "Logo", {
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
							<Typography variant="h2" mb={2} fontWeight={200}>
								{item.data.Name}
							</Typography>
						)}
						<Stack
							direction="row"
							gap={2}
							justifyItems="flex-start"
							alignItems="center"
						>
							<Typography style={{ opacity: "0.8" }} variant="subtitle2">
								{item.data.ProductionYear ?? ""}
								{item.data.Status === "Continuing"
									? " - Present"
									: item.data.EndDate &&
										` - ${new Date(item.data.EndDate).getFullYear()}`}
							</Typography>

							{seasons.data?.TotalRecordCount && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{seasons.data.TotalRecordCount > 1
										? `${seasons.data.TotalRecordCount} Seasons`
										: `${seasons.data.TotalRecordCount} Season`}
								</Typography>
							)}

							{item.data.OfficialRating && (
								<Chip
									variant="filled"
									size="small"
									label={item.data.OfficialRating}
								/>
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
										className="material-symbols-rounded fill"
										style={{
											// fontSize: "2.2em",
											color: yellow[400],
										}}
									>
										star
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle2"
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
										className="material-symbols-rounded fill"
										style={{
											color:
												item.data.CriticRating > 50 ? green[400] : red[400],
										}}
									>
										{item.data.CriticRating > 50 ? "thumb_up" : "thumb_down"}
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle2"
									>
										{item.data.CriticRating}
									</Typography>
								</div>
							)}

							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{getRuntime(item.data.RunTimeTicks)}
								</Typography>
							)}
							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{endsAt(
										item.data.RunTimeTicks -
											item.data.UserData.PlaybackPositionTicks,
									)}
								</Typography>
							)}
							<Typography variant="subtitle2" style={{ opacity: 0.8 }}>
								{item.data.Genres?.slice(0, 5).join(" / ")}
							</Typography>
						</Stack>
					</div>

					<div className="item-hero-buttons-container">
						<div
							className="flex flex-row"
							style={{
								width: "100%",
							}}
						>
							<PlayButton
								itemId={item.data.Id}
								item={item.data}
								itemType={item.data.Type}
								itemUserData={item.data.UserData}
								currentAudioTrack={0}
								currentVideoTrack={0}
								currentSubTrack={0}
								userId={user.data.Id}
								buttonProps={{
									fullWidth: true,
								}}
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
				<div className="item-detail">
					<div style={{ width: "100%" }}>
						{item.data.Taglines?.length > 0 && (
							<Typography variant="h5" mb={2}>
								{item.data.Taglines[0]}
							</Typography>
						)}
						<Typography variant="h5" fontStyle="italic" mb={1}>
							{item.data.Taglines[0] ?? ""}
						</Typography>
						<ShowMoreText
							content={item.data.Overview ?? ""}
							collapsedLines={4}
						/>
						<div
							style={{
								display: "flex",
								gap: "0.6em",
								alignSelf: "end",
							}}
						>
							{item.data.ExternalUrls.map((url) => (
								<IconLink url={url.Url} name={url.Name} />
							))}
						</div>
					</div>
					<div
						style={{
							width: "100%",
						}}
					>
						<div className="item-detail-cast">
							{actors.length > 0 && (
								<div className="item-detail-cast-container">
									<Typography variant="h6" className="item-detail-cast-title">
										Actors
									</Typography>
									<div className="item-detail-cast-grid">
										{actors.map((actor) => (
											<Link
												className="item-detail-cast-card"
												key={actor.Id}
												to={`/person/$id`}
												params={{
													id: actor.Id,
												}}
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
											</Link>
										))}
									</div>
								</div>
							)}
							{writers.length > 0 && (
								<div className="item-detail-cast-container">
									<Typography variant="h6" className="item-detail-cast-title">
										Writers
									</Typography>
									<div className="item-detail-cast-grid">
										{writers.map((actor) => (
											<Link
												className="item-detail-cast-card"
												key={actor.Id}
												to={`/person/$id`}
												params={{
													id: actor.Id,
												}}
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
											</Link>
										))}
									</div>
								</div>
							)}
							{directors.length > 0 && (
								<div className="item-detail-cast-container">
									<Typography variant="h6" className="item-detail-cast-title">
										Directors
									</Typography>
									<div className="item-detail-cast-grid">
										{directors.map((actor) => (
											<Link
												className="item-detail-cast-card"
												key={actor.Id}
												to={`/person/$id`}
												params={{
													id: actor.Id,
												}}
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
											</Link>
										))}
									</div>
								</div>
							)}
							{producers.length > 0 && (
								<div className="item-detail-cast-container">
									<Typography variant="h6" className="item-detail-cast-title">
										Producers
									</Typography>
									<div className="item-detail-cast-grid">
										{producers.map((actor) => (
											<Link
												className="item-detail-cast-card"
												key={actor.Id}
												to={`/person/$id`}
												params={{
													id: actor.Id,
												}}
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
											</Link>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{nextUpEpisode.isSuccess && nextUpEpisode.data.TotalRecordCount > 0 && (
					<CardScroller title="Next Up" displayCards={4} disableDecoration>
						{nextUpEpisode.data.Items.map((episode) => {
							return (
								<EpisodeCard
									key={episode.Id}
									item={episode}
									cardTitle={`S${episode.ParentIndexNumber}:E${episode.IndexNumber} - ${episode.Name}`}
									cardCaption={episode.Overview}
									imageBlurhash={
										episode.ImageBlurHashes?.Primary[
											Object.keys(episode.ImageBlurHashes.Primary)[0]
										]
									}
									queryKey={[
										"item",
										id,
										`season ${currentSeason + 1}`,
										"episodes",
									]}
									userId={user.data.Id}
								/>
							);
						})}
					</CardScroller>
				)}

				{seasons.isPending ? (
					<SeasonSelectorSkeleton />
				) : (
					<div className="item-series-seasons-container">
						<div
							style={{
								display: "flex",
								width: "100%",
								alignItems: "center",
								justifyContent: "space-between",
								paddingBottom: " 0.5em",
							}}
						>
							<div
								style={{
									display: "flex",
									gap: "1em",
								}}
							>
								<Typography variant="h5">
									{seasons.data.Items[currentSeason].Name}
								</Typography>
								<Chip
									label={
										episodes.isPending ? (
											<CircularProgress
												size={20}
												style={{
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											/>
										) : (
											episodes.data.TotalRecordCount
										)
									}
								/>
							</div>
							<div
								style={{
									display: "flex",
									gap: "0.75em",
								}}
							>
								{currentSeasonItem.isSuccess && (
									<LikeButton
										itemId={currentSeasonItem.data.Id}
										isFavorite={currentSeasonItem.data.UserData.IsFavorite}
										queryKey={["item", id, "season", currentSeason]}
										userId={user.data.Id}
										itemName={currentSeasonItem.data.Name}
									/>
								)}
								{currentSeasonItem.isSuccess && (
									<>
										<MarkPlayedButton
											itemId={currentSeasonItem.data.Id}
											isPlayed={currentSeasonItem.data.UserData.Played}
											queryKey={["item", id, "season", currentSeason]}
											userId={user.data.Id}
											itemName={currentSeasonItem.data.Name}
										/>
									</>
								)}
								<TextField
									value={currentSeason}
									onChange={(e) => {
										setCurrentSeason(e.target.value);
										sessionStorage.setItem(
											`season-${item.data?.Id}`,
											e.target.value,
										);
									}}
									select
									SelectProps={{
										MenuProps: {
											disableScrollLock: true,
										},
									}}
									size="small"
								>
									{seasons.data.Items.map((season, index) => {
										return (
											<MenuItem key={season.Id} value={index}>
												{season.Name}
											</MenuItem>
										);
									})}
								</TextField>
							</div>
						</div>
						<Divider />
						<div className="item-detail-episode-container">
							{episodes.isPending ? (
								<EpisodeSkeleton />
							) : (
								episodes.data.Items.map((episode, index) => {
									return (
										<motion.div
											key={episode.Id}
											onClick={() =>
												navigate({
													to: "/episode/$id",
													params: { id: episode.Id },
												})
											}
											initial={{
												transform: "translateY(10px)",
												opacity: 0,
											}}
											whileInView={{
												opacity: 1,
												transform: "translateY(0px)",
											}}
											viewport={{
												once: true,
											}}
											transition={{
												duration: 0.2,
												ease: "backInOut",
											}}
											style={{
												width: "100%",
											}}
											className="item-detail-episode"
										>
											<Typography variant="subtitle1" textAlign="center">
												{episode.IndexNumberEnd
													? `${episode.IndexNumber} / ${episode.IndexNumberEnd}`
													: episode.IndexNumber ?? 0}
											</Typography>
											<div
												className={
													episode.UserData?.Played
														? "item-detail-episode-image-container watched"
														: "item-detail-episode-image-container"
												}
											>
												<div className="item-detail-episode-image-overlay">
													<PlayButton
														item={episode}
														itemId={episode.Id}
														itemType="Episode"
														itemUserData={episode.UserData}
														userId={user.data.Id}
														currentAudioTrack={0}
														currentVideoTrack={0}
														currentSubTrack={0}
														size="medium"
														buttonProps={{
															color: "white",
															style: {
																color: "black ",
															},
														}}
														iconOnly
													/>
												</div>
												<div className="item-detail-episode-image-icon-container">
													<span className="material-symbols-rounded item-detail-episode-image-icon">
														tv_gen
													</span>
												</div>
												<img
													alt={episode.Name}
													src={api.getItemImageUrl(episode.Id, "Primary", {
														tag: episode.ImageTags.Primary,
														fillHeight: 300,
													})}
													className="item-detail-episode-image"
													onLoad={(e) => {
														e.target.style.opacity = 1;
													}}
												/>
												{episode.UserData?.PlaybackPositionTicks > 0 && (
													<div className="card-progress-container">
														<div
															className="card-progress"
															style={{
																width: `${episode.UserData?.PlayedPercentage}%`,
															}}
														/>
													</div>
												)}
											</div>
											<div className="item-detail-episode-info">
												<Typography variant="subtitle1">
													{episode.Name}
												</Typography>
												<div
													className="flex flex-row flex-align-center"
													style={{
														gap: "0.5em",
													}}
												>
													{episode.PremiereDate && (
														<Chip
															variant="filled"
															label={getEpisodeDateString(
																new Date(episode.PremiereDate),
															)}
															size="small"
														/>
													)}
													<Typography variant="caption">
														{getRuntimeCompact(episode.RunTimeTicks)}
													</Typography>
												</div>
												<Typography
													variant="caption"
													style={{
														display: "-webkit-box",
														textOverflow: "ellipsis",
														overflow: "hidden",
														WebkitLineClamp: 2,
														WebkitBoxOrient: "vertical",
														width: "100%",
														opacity: 0.7,
													}}
												>
													{episode.Overview}
												</Typography>
											</div>
											<div className="item-detail-episode-buttons">
												<LikeButton
													itemId={episode.Id}
													itemName={episode.Name}
													isFavorite={episode.UserData?.IsFavorite}
													queryKey={[
														"item",
														id,
														`season ${currentSeason + 1}`,
														"episodes",
													]}
													userId={user.data.Id}
												/>
												<MarkPlayedButton
													itemId={episode.Id}
													itemName={episode.Name}
													isPlayed={episode.UserData?.Played}
													queryKey={[
														"item",
														id,
														`season ${currentSeason + 1}`,
														"episodes",
													]}
													userId={user.data.Id}
												/>
											</div>
										</motion.div>
									);
								})
							)}
						</div>
					</div>
				)}
				{specialFeatures.isSuccess && specialFeatures.data.length > 0 && (
					<CardScroller
						title="Special Features"
						displayCards={7}
						disableDecoration
					>
						{specialFeatures.data.map((special) => {
							return (
								<Card
									key={special.Id}
									item={special}
									seriesId={special.SeriesId}
									cardTitle={special.Name}
									imageType="Primary"
									cardCaption={getRuntimeMusic(special.RunTimeTicks)}
									cardType="portrait"
									queryKey={["item", id, "similarItem"]}
									imageBlurhash={
										!!special.ImageBlurHashes?.Primary &&
										special.ImageBlurHashes.Primary[
											Object.keys(special.ImageBlurHashes.Primary)[0]
										]
									}
									userId={user.data.Id}
									onClick={() => {}}
								/>
							);
						})}
					</CardScroller>
				)}
				{similarItems.data.TotalRecordCount > 0 && (
					<CardScroller
						title="You might also like"
						displayCards={7}
						disableDecoration
					>
						{similarItems.data.Items.map((similar) => {
							return (
								<Card
									key={similar.Id}
									item={similar}
									seriesId={similar.SeriesId}
									cardTitle={
										similar.Type === BaseItemKind.Episode
											? similar.SeriesName
											: similar.Name
									}
									imageType={"Primary"}
									cardCaption={
										similar.Type === BaseItemKind.Episode
											? `S${similar.ParentIndexNumber}:E${similar.IndexNumber} - ${similar.Name}`
											: similar.Type === BaseItemKind.Series
												? `${similar.ProductionYear} - ${
														similar.EndDate
															? new Date(similar.EndDate).toLocaleString([], {
																	year: "numeric",
																})
															: "Present"
													}`
												: similar.ProductionYear
									}
									cardType={
										similar.Type === BaseItemKind.MusicAlbum ||
										similar.Type === BaseItemKind.Audio
											? "square"
											: "portrait"
									}
									queryKey={["item", id, "similarItem"]}
									userId={user.data.Id}
									imageBlurhash={
										!!similar.ImageBlurHashes?.Primary &&
										similar.ImageBlurHashes?.Primary[
											Object.keys(similar.ImageBlurHashes.Primary)[0]
										]
									}
								/>
							);
						})}
					</CardScroller>
				)}
			</motion.div>
		);
	}
	if (item.isError || similarItems.isError) {
		return <ErrorNotice />;
	}
}

export default SeriesTitlePage;
