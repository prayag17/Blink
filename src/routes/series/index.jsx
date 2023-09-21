/** @format */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

import { motion } from "framer-motion";

import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";

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

import { getRuntimeMusic, getRuntimeFull, endsAt } from "../../utils/date/time";

import Hero from "../../components/layouts/item/hero";
import { Card } from "../../components/card/card";
import { EpisodeCard } from "../../components/card/episodeCard";
import { CardScroller } from "../../components/cardScroller/cardScroller";

import "./series.module.scss";
import { EpisodeCardsSkeleton } from "../../components/skeleton/episodeCards";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";
import { usePlaybackStore } from "../../utils/store/playback";

import { useBackdropStore } from "../../utils/store/backdrop";
import { ActorCard } from "../../components/card/actorCards";
import { SeasonSelectorSkeleton } from "../../components/skeleton/seasonSelector";
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

function a11yProps(index) {
	return {
		id: `full-width-tab-${index}`,
		"aria-controls": `full-width-tabpanel-${index}`,
	};
}

const SeriesTitlePage = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});

	const item = useQuery({
		queryKey: ["item", id],
		queryFn: async () => {
			const result = await getUserLibraryApi(window.api).getItem({
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
			const result = await getLibraryApi(window.api).getSimilarShows({
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
			const result = await getTvShowsApi(window.api).getSeasons({
				userId: user.data.Id,
				seriesId: item.data.Id,
				isSpecialSeason: false,
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
			const result = await getTvShowsApi(window.api).getNextUp({
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
	const episodes = useQuery({
		queryKey: ["item", id, `season ${currentSeason + 1}`, "episodes"],
		queryFn: async () => {
			const result = await getTvShowsApi(window.api).getEpisodes({
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
			const result = await getUserLibraryApi(
				window.api,
			).getSpecialFeatures({
				itemId: item.data.Id,
				userId: user.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess,
	});
	const [
		setUrl,
		setPosition,
		setDuration,
		setItemId,
		setItemName,
		setSubtitleTracksStore,
		setSelectedSubtitleTrack,
	] = usePlaybackStore((state) => [
		state.setUrl,
		state.setPosition,
		state.setDuration,
		state.setItemId,
		state.setItemName,
		state.setSubtitleTracks,
		state.setSelectedSubtitleTrack,
	]);

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	const [directors, setDirectors] = useState([]);
	const [writers, setWriters] = useState([]);
	useEffect(() => {
		if (item.isSuccess) {
			setAppBackdrop(
				item.data.Type === BaseItemKind.MusicAlbum ||
					item.data.Type === BaseItemKind.Episode
					? `${window.api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`
					: `${window.api.basePath}/Items/${item.data.Id}/Images/Backdrop`,
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
		}
	}, [item.isSuccess]);

	if (item.isLoading || similarItems.isLoading) {
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
			<div
				className="scrollY"
				style={{
					padding: "5em 2em 2em 1em",
					display: "flex",
					flexDirection: "column",
					gap: "0.5em",
				}}
			>
				<Hero
					item={item.data}
					userId={user.data.Id}
					queryKey={["item", id]}
					writers={writers}
					directors={directors}
					studios={item.data.Studios}
				/>

				{nextUpEpisode.isSuccess &&
					nextUpEpisode.data.TotalRecordCount > 0 && (
						<CardScroller
							title="Next Up"
							displayCards={4}
							disableDecoration
						>
							{nextUpEpisode.data.Items.map(
								(episode, index) => {
									return (
										<EpisodeCard
											item={episode}
											cardTitle={`S${episode.ParentIndexNumber}:E${episode.IndexNumber} - ${episode.Name}`}
											cardCaption={
												episode.Overview
											}
											imageBlurhash={
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
											userId={user.data.Id}
										/>
									);
								},
							)}
						</CardScroller>
					)}

				{seasons.isLoading ? (
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
										episodes.isLoading ? (
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
							<TextField
								value={currentSeason}
								onChange={(e) =>
									setCurrentSeason(e.target.value)
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
						<Divider />
						<div className="item-detail-episodes-container">
							{episodes.isLoading ? (
								<EpisodeCardsSkeleton />
							) : (
								episodes.data.Items.map(
									(episode, index) => {
										return (
											<motion.div
												key={episode.Id}
												initial={{
													transform:
														"translateY(10px)",
													opacity: 0,
												}}
												animate={{
													opacity: 1,
													transform:
														"translateY(0px)",
												}}
												transition={{
													delay:
														index *
														0.05,
													duration: 0.2,
													ease: "backInOut",
												}}
												style={{
													maxWidth:
														"23.3vw",
												}}
											>
												<EpisodeCard
													item={episode}
													cardTitle={
														episode.ParentIndexNumber ==
														0
															? `${episode.SeasonName} - ${episode.Name}`
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
									},
								)
							)}
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
							{specialFeatures.data.map(
								(special, index) => {
									return (
										<Card
											key={special.Id}
											item={special}
											seriesId={
												special.SeriesId
											}
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
												!!special
													.ImageBlurHashes
													?.Primary &&
												special
													.ImageBlurHashes
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
								},
							)}
						</CardScroller>
					)}
				{item.data.People.length > 0 && (
					<CardScroller
						title="Cast & Crew"
						displayCards={8}
						disableDecoration
					>
						{item.data.People.map((person, index) => {
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
				)}
				{similarItems.data.TotalRecordCount > 0 && (
					<CardScroller
						title="More Like This"
						displayCards={8}
						disableDecoration
					>
						{similarItems.data.Items.map((similar, index) => {
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
													!!similar.EndDate
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
			</div>
		);
	}
	if (item.isError || similarItems.isError) {
		return <ErrorNotice />;
	}
};

export default SeriesTitlePage;
