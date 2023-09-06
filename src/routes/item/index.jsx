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

import "./item.module.scss";
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

const ItemDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [primageImageLoaded, setPrimaryImageLoaded] = useState(false);
	const [backdropImageLoaded, setBackdropImageLoaded] = useState(false);

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

	const upcomingEpisodes = useQuery({
		queryKey: ["item", id, "episode", "upcomingEpisodes"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				parentId: item.data.ParentId,
				startIndex: item.data.IndexNumber,
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.Episode,
		networkMode: "always",
	});

	const personMovies = useQuery({
		queryKey: ["item", id, "personMovies"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				personIds: [id],
				includeItemTypes: [BaseItemKind.Movie],
				recursive: true,
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: ["Descending"],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.Person,
		networkMode: "always",
	});
	const personShows = useQuery({
		queryKey: ["item", id, "personShows"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				personIds: [id],
				includeItemTypes: [BaseItemKind.Series],
				recursive: true,
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: ["Descending"],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.Person,
		networkMode: "always",
	});

	const personBooks = useQuery({
		queryKey: ["item", id, "personBooks"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				personIds: [id],
				includeItemTypes: [BaseItemKind.Book],
				recursive: true,
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: ["Descending"],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.Person,
		networkMode: "always",
	});
	const personPhotos = useQuery({
		queryKey: ["item", id, "personPhotos"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				personIds: [id],
				includeItemTypes: [BaseItemKind.Photo],
				recursive: true,
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.Person,
		networkMode: "always",
	});
	const personEpisodes = useQuery({
		queryKey: ["item", id, "personEpisodes"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				personIds: [id],
				includeItemTypes: [BaseItemKind.Episode],
				recursive: true,
				fields: ["SeasonUserData", "Overview"],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.Person,
		networkMode: "always",
	});

	const musicTracks = useQuery({
		queryKey: ["item", id, "musicTracks"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				parentId: item.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.MusicAlbum,
		networkMode: "always",
	});

	const artistDiscography = useQuery({
		queryKey: ["item", id, "artist", "discography"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				albumArtistIds: [item.data.Id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user.data.Id,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.MusicArtist,
		networkMode: "always",
	});

	const artistSongs = useQuery({
		queryKey: ["item", id, "artist", "songs"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				artistIds: [item.data.Id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.Audio],
				userId: user.data.Id,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.MusicArtist,
		networkMode: "always",
	});

	const artistAppearances = useQuery({
		queryKey: ["item", id, "artist", "appearences"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				contributingArtistIds: [item.data.Id],
				excludeItemIds: [item.data.Id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.MusicArtist,
		networkMode: "always",
	});

	const handleMarkPlayedOrunPlayed = async () => {
		let result;
		if (!item.data.UserData.Played) {
			result = await getPlaystateApi(window.api).markPlayedItem({
				userId: user.data.Id,
				itemId: item.data.Id,
			});
		} else if (item.data.UserData.Played) {
			result = await getPlaystateApi(window.api).markUnplayedItem({
				userId: user.data.Id,
				itemId: item.data.Id,
			});
		}
		item.refetch();
	};
	const handleLiking = async () => {
		let result;
		if (item.data.UserData.IsFavorite) {
			result = await getUserLibraryApi(window.api).unmarkFavoriteItem({
				userId: user.data.Id,
				itemId: item.data.Id,
			});
		} else if (!item.data.UserData.IsFavorite) {
			result = await getUserLibraryApi(window.api).markFavoriteItem({
				userId: user.data.Id,
				itemId: item.data.Id,
			});
		}
		item.refetch();
	};
	const handleLikingTrack = async (track) => {
		let result;
		if (track.UserData.IsFavorite) {
			result = await getUserLibraryApi(window.api).unmarkFavoriteItem({
				userId: user.data.Id,
				itemId: track.Id,
			});
		} else if (!track.UserData.IsFavorite) {
			result = await getUserLibraryApi(window.api).markFavoriteItem({
				userId: user.data.Id,
				itemId: track.Id,
			});
		}
		item.refetch();
		musicTracks.refetch();
	};

	const [activePersonTab, setActivePersonTab] = useState(0);

	const personTabs = ["Movies", "TV Shows", "Books", "Photos", "Episodes"];

	useEffect(() => {
		if (
			personMovies.isSuccess &&
			personShows.isSuccess &&
			personBooks.isSuccess &&
			personPhotos.isSuccess &&
			personEpisodes.isSuccess
		) {
			if (personMovies.data.Items.length != 0) {
				setActivePersonTab(0);
			} else if (personShows.data.Items.length != 0) {
				setActivePersonTab(1);
			} else if (personBooks.data.Items.length != 0) {
				setActivePersonTab(2);
			} else if (personPhotos.data.Items.length != 0) {
				setActivePersonTab(3);
			} else if (personEpisodes.data.Items.length != 0) {
				setActivePersonTab(4);
			}
		}
	}, [
		personMovies.isLoading,
		personShows.isLoading,
		personBooks.isLoading,
		personPhotos.isLoading,
		personEpisodes.isLoading,
	]);

	const artistTabs = ["Discography", "Songs", "Appearances"];
	const [activeArtistTab, setActiveArtistTab] = useState(0);

	useEffect(() => {
		if (
			artistDiscography.isSuccess &&
			artistSongs.isSuccess &&
			artistAppearances.isSuccess
		) {
			if (artistDiscography.data.TotalRecordCount != 0) {
				setActivePersonTab(0);
			} else if (artistSongs.data.TotalRecordCount != 0) {
				setActivePersonTab(1);
			} else if (artistAppearances.data.TotalRecordCount != 0) {
				setActivePersonTab(2);
			}
		}
	}, [
		artistDiscography.isLoading,
		artistSongs.isLoading,
		artistAppearances.isLoading,
	]);

	const [videoTracks, setVideoTracks] = useState([]);
	const [audioTracks, setAudioTracks] = useState([]);
	const [subtitleTracks, setSubtitleTracks] = useState([]);

	const [currentVideoTrack, setCurrentVideoTrack] = useState("");
	const [currentAudioTrack, setCurrentAudioTrack] = useState("");
	const [currentSubTrack, setCurrentSubTrack] = useState("");

	useEffect(() => {
		if (item.isSuccess && !!item.data.MediaStreams) {
			let videos = [];
			let audios = [];
			let subs = [];
			for (let track of item.data.MediaStreams) {
				switch (track.Type) {
					case MediaStreamType.Video:
						videos.push(track);
						break;
					case MediaStreamType.Audio:
						audios.push(track);
						break;
					case MediaStreamType.Subtitle:
						subs.push(track);
						break;
					default:
						break;
				}
			}

			setVideoTracks(videos);
			setAudioTracks(audios);
			setSubtitleTracks(subs);

			setCurrentVideoTrack(videos[0]?.Index);
			setCurrentAudioTrack(audios[0]?.Index);
			setCurrentSubTrack(subs[0]?.Index);
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
				}}
			>
				<Hero
					item={item.data}
					userId={user.data.Id}
					queryKey={["item", id]}
					writers={writers}
					directors={directors}
				/>
			</div>
		);
	}
	if (item.isError || similarItems.isError) {
		return <ErrorNotice />;
	}
};

export default ItemDetail;
