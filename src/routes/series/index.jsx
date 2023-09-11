/** @format */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Grid2 from "@mui/material/Unstable_Grid2";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Link from "@mui/material/Link";
import { green, pink, yellow } from "@mui/material/colors";

import { AnimatePresence, motion } from "framer-motion";

import { Blurhash } from "react-blurhash";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";

import {
	BaseItemKind,
	ItemFields,
	LocationType,
	MediaStreamType,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";

import { useQuery } from "@tanstack/react-query";

import { MdiPlayOutline } from "../../components/icons/mdiPlayOutline";
import { MdiStar } from "../../components/icons/mdiStar";
import { MdiCheck } from "../../components/icons/mdiCheck";
import { MdiHeartOutline } from "../../components/icons/mdiHeartOutline";
import { MdiHeart } from "../../components/icons/mdiHeart";
import { MdiClockOutline } from "../../components/icons/mdiClockOutline";

import { getRuntimeMusic, getRuntimeFull, endsAt } from "../../utils/date/time";
import { TypeIconCollectionCard } from "../../components/utils/iconsCollection";

import Hero from "../../components/layouts/item/hero";
import { Card } from "../../components/card/card";
import { EpisodeCard } from "../../components/card/episodeCard";
import { CardScroller } from "../../components/cardScroller/cardScroller";

import "./series.module.scss";
import { EpisodeCardsSkeleton } from "../../components/skeleton/episodeCards";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";
import { ArtistAlbum } from "../../components/layouts/artist/artistAlbum";
import { MdiMusic } from "../../components/icons/mdiMusic";
import { usePlaybackStore } from "../../utils/store/playback";
import { Tooltip } from "@mui/material";
import { useBackdropStore } from "../../utils/store/backdrop";
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
			let result;
			if (item.data.Type == "Movie") {
				result = await getLibraryApi(window.api).getSimilarMovies({
					userId: user.data.Id,
					itemId: item.data.Id,
				});
			} else if (item.data.Type == "Series") {
				result = await getLibraryApi(window.api).getSimilarShows({
					userId: user.data.Id,
					itemId: item.data.Id,
				});
			} else if (item.data.Type == "MusicAlbum") {
				result = await getLibraryApi(window.api).getSimilarAlbums({
					userId: user.data.Id,
					itemId: item.data.Id,
				});
			} else if (item.data.Type == "MusicArtist") {
				result = await getLibraryApi(window.api).getSimilarArtists({
					userId: user.data.Id,
					itemId: item.data.Id,
				});
			} else {
				result = await getLibraryApi(window.api).getSimilarItems({
					userId: user.data.Id,
					itemId: item.data.Id,
				});
			}
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
				seriesId: item.data.Id,
				isSpecialSeason: false,
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == "Series",
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
			const result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				parentId: seasons.data.Items[currentSeason].Id,
				fields: [ItemFields.SeasonUserData, "Overview"],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		enabled: seasons.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const [videoTracks, setVideoTracks] = useState([]);
	const [audioTracks, setAudioTracks] = useState([]);
	const [subtitleTracks, setSubtitleTracks] = useState([]);

	const filterMediaStreamVideo = (source) => {
		if (source.Type == MediaStreamType.Video) {
			return true;
		}
		return false;
	};
	const filterMediaStreamAudio = (source) => {
		if (source.Type == MediaStreamType.Audio) {
			return true;
		}
		return false;
	};
	const filterMediaStreamSubtitle = (source) => {
		if (source.Type == MediaStreamType.Subtitle) {
			return true;
		}
		return false;
	};

	useEffect(() => {
		if (item.isSuccess && !!item.data.MediaStreams) {
			let videos = item.data.MediaStreams.filter(
				filterMediaStreamVideo,
			);
			let audios = item.data.MediaStreams.filter(
				filterMediaStreamAudio,
			);
			let subs = item.data.MediaStreams.filter(
				filterMediaStreamSubtitle,
			);

			setVideoTracks(videos);
			setAudioTracks(audios);
			setSubtitleTracks(subs);
		}
	}, [item.isSuccess]);

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
					videoTracks={videoTracks}
					audioTracks={audioTracks}
					subtitleTracks={subtitleTracks}
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
										<Card
											key={episode.Id}
											item={episode}
											cardTitle={episode.Name}
											cardCaption={
												episode.Role
											}
											cardType="thumb"
											userId={user.data.Id}
											imageBlurhash={
												episode
													.ImageBlurHashes
													?.Primary[0]
											}
											// overrideIcon="Person"
											// disableOverlay
										/>
									);
								},
							)}
						</CardScroller>
					)}
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
										<Card
											key={episode.Id}
											item={episode}
											cardTitle={episode.Name}
											cardCaption={
												episode.Role
											}
											cardType="thumb"
											userId={user.data.Id}
											imageBlurhash={
												episode
													.ImageBlurHashes
													?.Primary[0]
											}
											// overrideIcon="Person"
											// disableOverlay
										/>
									);
								},
							)}
						</CardScroller>
					)}

				<CardScroller
					title="Cast & Crew"
					displayCards={8}
					disableDecoration
				>
					{item.data.People.map((person, index) => {
						return (
							<Card
								key={person.Id}
								item={person}
								cardTitle={person.Name}
								cardCaption={person.Role}
								cardType="square"
								userId={user.data.Id}
								imageBlurhash={
									person.ImageBlurHashes?.Primary[0]
								}
								overrideIcon="Person"
								disableOverlay
							/>
						);
					})}
				</CardScroller>
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
									similar.Type == BaseItemKind.Audio
										? "square"
										: "portrait"
								}
								queryKey={["item", id, "similarItem"]}
								userId={user.data.Id}
								imageBlurhash={
									similar.ImageBlurHashes?.Primary[
										Object.keys(
											similar.ImageBlurHashes
												.Primary,
										)[0]
									]
								}
							/>
						);
					})}
				</CardScroller>
			</div>
		);
	}
	if (item.isError || similarItems.isError) {
		return <ErrorNotice />;
	}
};

export default SeriesTitlePage;
