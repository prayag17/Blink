/** @format */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import MuiCard from "@mui/material/Card";
import { red, yellow, green } from "@mui/material/colors";

import { motion } from "framer-motion";

import { useParams } from "react-router-dom";

import { Blurhash } from "react-blurhash";

import {
	BaseItemKind,
	ItemFields,
	LocationType,
} from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";

import { useQuery } from "@tanstack/react-query";

import { endsAt, getRuntime, getRuntimeMusic } from "../../utils/date/time";

import { Card } from "../../components/card/card";
import { EpisodeCard } from "../../components/card/episodeCard";
import { CardScroller } from "../../components/cardScroller/cardScroller";

import "./series.module.scss";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";

import { useBackdropStore } from "../../utils/store/backdrop";
import { SeasonSelectorSkeleton } from "../../components/skeleton/seasonSelector";
import LikeButton from "../../components/buttons/likeButton";
import MarkPlayedButton from "../../components/buttons/markPlayedButton";
import { useApi } from "../../utils/store/api";
import { Link } from "react-router-dom";
import TextLink from "../../components/textLink";
import PlayButton from "../../components/buttons/playButton";
import { getTypeIcon } from "../../components/utils/iconsCollection";
import { NavLink } from "react-router-dom";
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

const SeriesTitlePage = () => {
	const { id } = useParams();

	const [api] = useApi((state) => [state.api]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(api).getCurrentUser();
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
		enabled: item.isSuccess && item.data.Type == "Series",
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const [currentSeason, setCurrentSeason] = useState(0);

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
		queryKey: ["item", id, `specialFeatures`],
		queryFn: async () => {
			const result = await getUserLibraryApi(api).getSpecialFeatures({
				itemId: item.data.Id,
				userId: user.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess,
	});
	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	const [directors, setDirectors] = useState([]);
	const [writers, setWriters] = useState([]);
	const [actors, setActors] = useState([]);
	const [producers, setProducers] = useState([]);
	useEffect(() => {
		if (item.isSuccess) {
			setAppBackdrop(
				item.data.Type === BaseItemKind.MusicAlbum ||
					item.data.Type === BaseItemKind.Episode
					? `${api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`
					: `${api.basePath}/Items/${item.data.Id}/Images/Backdrop`,
				item.data.Id,
			);
			let direTp = item.data.People.filter(
				(itm) => itm.Type == "Director",
			);
			setDirectors(direTp);
			let writeTp = item.data.People.filter(
				(itm) => itm.Type == "Writer",
			);
			setWriters(writeTp);
			let producerTp = item.data.People.filter(
				(itm) => itm.Type == "Producer",
			);
			setProducers(producerTp);
			let actorTp = item.data.People.filter(
				(itm) => itm.Type == "Actor",
			);
			setActors(actorTp);
		}
	}, [item.isSuccess]);

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
			>
				<div className="item-hero flex flex-row">
					<div className="item-hero-backdrop-container">
						{item.data.BackdropImageTags ? (
							<img
								src={api.getItemImageUrl(
									item.data.Id,
									"Backdrop",
									{
										quality: 90,
									},
								)}
								className="item-hero-backdrop"
								onLoad={(e) =>
									(e.currentTarget.style.opacity = 1)
								}
							/>
						) : (
							<></>
						)}
					</div>
					<div
						className="item-hero-image-container"
						style={{
							aspectRatio:
								item.data.PrimaryImageAspectRatio ?? 1,
						}}
					>
						{Object.keys(item.data.ImageTags).includes(
							"Primary",
						) ? (
							<>
								<Blurhash
									hash={
										item.data.ImageBlurHashes
											.Primary[
											item.data.ImageTags[
												"Primary"
											]
										]
									}
									className="item-hero-image-blurhash"
								/>
								<img
									src={api.getItemImageUrl(
										item.data.Id,
										"Primary",
										{
											quality: 90,
											tag: item.data.ImageTags[
												"Primary"
											],
										},
									)}
									onLoad={(e) =>
										(e.currentTarget.style.opacity = 1)
									}
									className="item-hero-image"
								/>
							</>
						) : (
							<></>
						)}
					</div>
					<div className="item-hero-detail flex flex-column">
						{Object.keys(item.data.ImageTags).includes(
							"Logo",
						) ? (
							<img
								src={api.getItemImageUrl(
									item.data.Id,
									"Logo",
									{
										quality: 90,
										fillWidth: 592,
										fillHeight: 592,
									},
								)}
								onLoad={(e) =>
									(e.currentTarget.style.opacity = 1)
								}
								className="item-hero-logo"
							/>
						) : (
							<Typography variant="h3">
								{item.data.Name}
							</Typography>
						)}
						<Stack
							direction="row"
							gap={2}
							justifyItems="flex-start"
							alignItems="center"
						>
							<Typography
								style={{ opacity: "0.8" }}
								variant="subtitle1"
							>
								{item.data.ProductionYear ?? ""}
							</Typography>
							{item.data.OfficialRating && (
								<Chip
									variant="filled"
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
										{Math.round(
											item.data
												.CommunityRating *
												10,
										) / 10}
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
												item.data
													.CriticRating >
												50
													? green[400]
													: red[400],
											fontVariationSettings:
												'"FILL" 1, "wght" 300, "GRAD" 25, "opsz" 40',
										}}
									>
										{item.data.CriticRating > 50
											? "thumb_up"
											: "thumb_down"}
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

							{seasons.data?.TotalRecordCount && (
								<Typography
									style={{ opacity: "0.8" }}
									variant="subtitle1"
								>
									{seasons.data.TotalRecordCount > 1
										? `${seasons.data.TotalRecordCount} Seasons`
										: `${seasons.data.TotalRecordCount} Season`}
								</Typography>
							)}

							{item.data.RunTimeTicks && (
								<Typography
									style={{ opacity: "0.8" }}
									variant="subtitle1"
								>
									{getRuntime(
										item.data.RunTimeTicks,
									)}
								</Typography>
							)}
							{item.data.RunTimeTicks && (
								<Typography
									style={{ opacity: "0.8" }}
									variant="subtitle1"
								>
									{endsAt(
										item.data.RunTimeTicks -
											item.data.UserData
												.PlaybackPositionTicks,
									)}
								</Typography>
							)}
						</Stack>
						<Typography
							variant="subtitle1"
							style={{ opacity: 0.8 }}
						>
							{item.data.Genres.join(", ")}
						</Typography>

						<div className="item-hero-buttons-container flex flex-row">
							<div className="flex flex-row">
								<PlayButton
									itemId={item.data.Id}
									itemType={item.data.Type}
									itemUserData={item.data.UserData}
									currentAudioTrack={0}
									currentVideoTrack={0}
									currentSubTrack={0}
									userId={user.data.Id}
								/>
							</div>
							<div
								className="flex flex-row"
								style={{ gap: "1em" }}
							>
								<LikeButton
									itemName={item.data.Name}
									itemId={item.data.Id}
									queryKey={["item", id]}
									isFavorite={
										item.data.UserData.IsFavorite
									}
									userId={user.data.Id}
								/>
								<MarkPlayedButton
									itemName={item.data.Name}
									itemId={item.data.Id}
									queryKey={["item", id]}
									isPlayed={
										item.data.UserData.Played
									}
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
											item.data.UserData
												.PlaybackPositionTicks,
									)}{" "}
									left
								</Typography>
								<LinearProgress
									color="white"
									variant="determinate"
									value={
										item.data.UserData
											.PlayedPercentage
									}
									style={{
										borderRadius: "10px",
									}}
								/>
							</div>
						)}
						<Typography
							variant="h5"
							fontStyle="italic"
							mb={1}
						>
							{item.data.Taglines[0] ?? ""}
						</Typography>
						<Typography variant="subtitle1">
							{item.data.Overview ?? ""}
						</Typography>
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
												variant={
													"subtitle1"
												}
												location={`/person/${writer.Id}`}
											>
												{writer.Name}
											</TextLink>
											{index !=
												writers.length -
													1 && (
												<span
													style={{
														whiteSpace:
															"pre",
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
									{directors.map(
										(director, index) => (
											<>
												<TextLink
													key={
														director.Id
													}
													variant={
														"subtitle1"
													}
													location={`/person/${director.Id}`}
												>
													{director.Name}
												</TextLink>
												{index !=
													directors.length -
														1 && (
													<span
														style={{
															whiteSpace:
																"pre",
														}}
													>
														,{" "}
													</span>
												)}
											</>
										),
									)}
								</div>
							</div>
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
								<Link
									key={url.Url}
									target="_blank"
									to={url.Url}
									className="item-detail-link"
								>
									<Typography>{url.Name}</Typography>
								</Link>
							))}
						</div>
					</div>
					<Divider flexItem orientation="vertical" />
					<div
						style={{
							width: "100%",
						}}
					>
						<div className="item-detail-cast">
							{actors.length > 0 && (
								<div className="item-detail-cast-container">
									<Typography
										variant="h6"
										className="item-detail-cast-title"
									>
										Actors
									</Typography>
									<div className="item-detail-cast-grid">
										{actors.map((actor) => (
											<NavLink
												className="item-detail-cast-card"
												key={actor.Id}
												to={`/person/${actor.Id}`}
											>
												{actor.PrimaryImageTag ? (
													<img
														src={api.getItemImageUrl(
															actor.Id,
															"Primary",
															{
																quality: 80,
																fillWidth: 200,
																fillHeight: 200,
															},
														)}
														className="item-detail-cast-card-image"
													/>
												) : (
													<div className="item-detail-cast-card-icon">
														{getTypeIcon(
															"Person",
														)}
													</div>
												)}
												<div className="item-detail-cast-card-text">
													<Typography variant="subtitle1">
														{
															actor.Name
														}
													</Typography>
													<Typography
														variant="subtitle2"
														style={{
															opacity: 0.5,
														}}
													>
														{
															actor.Role
														}
													</Typography>
												</div>
											</NavLink>
										))}
									</div>
								</div>
							)}
							{writers.length > 0 && (
								<div className="item-detail-cast-container">
									<Typography
										variant="h6"
										className="item-detail-cast-title"
									>
										Writers
									</Typography>
									<div className="item-detail-cast-grid">
										{writers.map((actor) => (
											<NavLink
												className="item-detail-cast-card"
												key={actor.Id}
												to={`/person/${actor.Id}`}
											>
												{actor.PrimaryImageTag ? (
													<img
														src={api.getItemImageUrl(
															actor.Id,
															"Primary",
															{
																quality: 80,
																fillWidth: 200,
																fillHeight: 200,
															},
														)}
														className="item-detail-cast-card-image"
													/>
												) : (
													<div className="item-detail-cast-card-icon">
														{getTypeIcon(
															"Person",
														)}
													</div>
												)}
												<div className="item-detail-cast-card-text">
													<Typography variant="subtitle1">
														{
															actor.Name
														}
													</Typography>
													<Typography
														variant="subtitle2"
														style={{
															opacity: 0.5,
														}}
													>
														{
															actor.Role
														}
													</Typography>
												</div>
											</NavLink>
										))}
									</div>
								</div>
							)}
							{directors.length > 0 && (
								<div className="item-detail-cast-container">
									<Typography
										variant="h6"
										className="item-detail-cast-title"
									>
										Directors
									</Typography>
									<div className="item-detail-cast-grid">
										{directors.map((actor) => (
											<NavLink
												className="item-detail-cast-card"
												to={`/person/${actor.Id}`}
												key={actor.Id}
											>
												{actor.PrimaryImageTag ? (
													<img
														src={api.getItemImageUrl(
															actor.Id,
															"Primary",
															{
																quality: 80,
																fillWidth: 200,
																fillHeight: 200,
															},
														)}
														className="item-detail-cast-card-image"
													/>
												) : (
													<div className="item-detail-cast-card-icon">
														{getTypeIcon(
															"Person",
														)}
													</div>
												)}
												<div className="item-detail-cast-card-text">
													<Typography variant="subtitle1">
														{
															actor.Name
														}
													</Typography>
													<Typography
														variant="subtitle2"
														style={{
															opacity: 0.5,
														}}
													>
														{
															actor.Role
														}
													</Typography>
												</div>
											</NavLink>
										))}
									</div>
								</div>
							)}
							{producers.length > 0 && (
								<div className="item-detail-cast-container">
									<Typography
										variant="h6"
										className="item-detail-cast-title"
									>
										Producers
									</Typography>
									<div className="item-detail-cast-grid">
										{producers.map((actor) => (
											<NavLink
												className="item-detail-cast-card"
												key={actor.Id}
												to={`/person/${actor.Id}`}
											>
												{actor.PrimaryImageTag ? (
													<img
														src={api.getItemImageUrl(
															actor.Id,
															"Primary",
															{
																quality: 80,
																fillWidth: 200,
																fillHeight: 200,
															},
														)}
														className="item-detail-cast-card-image"
													/>
												) : (
													<div className="item-detail-cast-card-icon">
														{getTypeIcon(
															"Person",
														)}
													</div>
												)}
												<div className="item-detail-cast-card-text">
													<Typography variant="subtitle1">
														{
															actor.Name
														}
													</Typography>
													<Typography
														variant="subtitle2"
														style={{
															opacity: 0.5,
														}}
													>
														{
															actor.Role
														}
													</Typography>
												</div>
											</NavLink>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{nextUpEpisode.isSuccess &&
					nextUpEpisode.data.TotalRecordCount > 0 && (
						<CardScroller
							title="Next Up"
							displayCards={4}
							disableDecoration
						>
							{nextUpEpisode.data.Items.map((episode) => {
								return (
									<EpisodeCard
										key={episode.Id}
										item={episode}
										cardTitle={`S${episode.ParentIndexNumber}:E${episode.IndexNumber} - ${episode.Name}`}
										cardCaption={episode.Overview}
										imageBlurhash={
											episode.ImageBlurHashes
												?.Primary[
												Object.keys(
													episode
														.ImageBlurHashes
														.Primary,
												)[0]
											]
										}
										queryKey={[
											"item",
											id,
											`season ${
												currentSeason + 1
											}`,
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
									{
										seasons.data.Items[
											currentSeason
										].Name
									}
								</Typography>
								<Chip
									label={
										episodes.isPending ? (
											<CircularProgress
												size={20}
												style={{
													display: "flex",
													alignItems:
														"center",
													justifyContent:
														"center",
												}}
											/>
										) : (
											episodes.data
												.TotalRecordCount
										)
									}
								></Chip>
							</div>
							<div
								style={{
									display: "flex",
									gap: "0.75em",
								}}
							>
								{currentSeasonItem.isSuccess && (
									<LikeButton
										itemId={
											currentSeasonItem.data.Id
										}
										isFavorite={
											currentSeasonItem.data
												.UserData.IsFavorite
										}
										queryKey={[
											"item",
											id,
											"season",
											currentSeason,
										]}
										userId={user.data.Id}
										itemName={
											currentSeasonItem.data
												.Name
										}
									/>
								)}
								{currentSeasonItem.isSuccess && (
									<>
										<MarkPlayedButton
											itemId={
												currentSeasonItem
													.data.Id
											}
											isPlayed={
												currentSeasonItem
													.data.UserData
													.Played
											}
											queryKey={[
												"item",
												id,
												"season",
												currentSeason,
											]}
											userId={user.data.Id}
											itemName={
												currentSeasonItem
													.data.Name
											}
										/>
									</>
								)}
								<TextField
									value={currentSeason}
									onChange={(e) =>
										setCurrentSeason(
											e.target.value,
										)
									}
									select
									SelectProps={{
										MenuProps: {
											disableScrollLock: true,
										},
									}}
									size="small"
								>
									{seasons.data.Items.map(
										(season, index) => {
											return (
												<MenuItem
													key={season.Id}
													value={index}
												>
													{season.Name}
												</MenuItem>
											);
										},
									)}
								</TextField>
							</div>
						</div>
						<Divider />
						<div className="item-detail-episodes-container">
							{episodes.isPending
								? Array.from(new Array(4)).map((a) => {
										return (
											<MuiCard
												key={a}
												sx={{
													background:
														"transparent",
												}}
												elevation={0}
											>
												<CardMedia>
													<Skeleton
														animation="wave"
														variant="rectangular"
														sx={{
															aspectRatio:
																"1.777",
															height: "auto",
															m: 1,
															borderRadius:
																"10px",
														}}
													/>
												</CardMedia>
												<CardContent
													sx={{
														padding: "0 0.5em",
														alignItems:
															"flex-start",
														backgroundColor:
															"transparent",
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
											</MuiCard>
										);
								  })
								: episodes.data.Items.map((episode) => {
										return (
											<motion.div
												key={episode.Id}
												initial={{
													transform:
														"translateY(10px)",
													opacity: 0,
												}}
												whileInView={{
													opacity: 1,
													transform:
														"translateY(0px)",
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
											>
												<EpisodeCard
													item={episode}
													cardTitle={
														episode.ParentIndexNumber ==
														0
															? `${episode.SeasonName} - ${episode.Name}`
															: episode.IndexNumberEnd
															? `${episode.IndexNumber}-${episode.IndexNumberEnd}. ${episode.Name}`
															: `${episode.IndexNumber}. ${episode.Name}`
													}
													cardCaption={
														episode.Overview
													}
													imageBlurhash={
														!!episode
															.ImageBlurHashes
															?.Primary &&
														episode
															.ImageBlurHashes
															?.Primary[
															Object.keys(
																episode
																	.ImageBlurHashes
																	.Primary,
															)[0]
														]
													}
													queryKey={[
														"item",
														id,
														`season ${
															currentSeason +
															1
														}`,
														"episodes",
													]}
													userId={
														user.data
															.Id
													}
												/>
											</motion.div>
										);
								  })}
						</div>
					</div>
				)}
				{specialFeatures.isSuccess &&
					specialFeatures.data.length > 0 && (
						<CardScroller
							title="Special Features"
							displayCards={8}
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
										cardCaption={getRuntimeMusic(
											special.RunTimeTicks,
										)}
										cardType="portrait"
										queryKey={[
											"item",
											id,
											"similarItem",
										]}
										imageBlurhash={
											!!special.ImageBlurHashes
												?.Primary &&
											special.ImageBlurHashes
												.Primary[
												Object.keys(
													special
														.ImageBlurHashes
														.Primary,
												)[0]
											]
										}
										userId={user.data.Id}
										onClick={() => {}}
									/>
								);
							})}
						</CardScroller>
					)}
				{/* {item.data.People.length > 0 && (
					<CardScroller
						title="Cast & Crew"
						displayCards={8}
						disableDecoration
					>
						{item.data.People.map((person) => {
							return (
								<ActorCard
									key={person.Id}
									item={person}
									cardTitle={person.Name}
									cardCaption={person.Role}
									cardType="square"
									userId={user.data.Id}
									imageBlurhash={
										person.ImageBlurHashes
											?.Primary[0]
									}
									overrideIcon="Person"
									disableOverlay
								/>
							);
						})}
					</CardScroller>
				)} */}
				{similarItems.data.TotalRecordCount > 0 && (
					<CardScroller
						title="You might also like"
						displayCards={8}
						disableDecoration
					>
						{similarItems.data.Items.map((similar) => {
							return (
								<Card
									key={similar.Id}
									item={similar}
									seriesId={similar.SeriesId}
									cardTitle={
										similar.Type ==
										BaseItemKind.Episode
											? similar.SeriesName
											: similar.Name
									}
									imageType={"Primary"}
									cardCaption={
										similar.Type ==
										BaseItemKind.Episode
											? `S${similar.ParentIndexNumber}:E${similar.IndexNumber} - ${similar.Name}`
											: similar.Type ==
											  BaseItemKind.Series
											? `${
													similar.ProductionYear
											  } - ${
													similar.EndDate
														? new Date(
																similar.EndDate,
														  ).toLocaleString(
																[],
																{
																	year: "numeric",
																},
														  )
														: "Present"
											  }`
											: similar.ProductionYear
									}
									cardType={
										similar.Type ==
											BaseItemKind.MusicAlbum ||
										similar.Type ==
											BaseItemKind.Audio
											? "square"
											: "portrait"
									}
									queryKey={[
										"item",
										id,
										"similarItem",
									]}
									userId={user.data.Id}
									imageBlurhash={
										!!similar.ImageBlurHashes
											?.Primary &&
										similar.ImageBlurHashes
											?.Primary[
											Object.keys(
												similar
													.ImageBlurHashes
													.Primary,
											)[0]
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
};

export default SeriesTitlePage;
