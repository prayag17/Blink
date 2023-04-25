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
import { green, pink } from "@mui/material/colors";

import { AvatarImage } from "../../components/avatar/avatar";

import { Blurhash } from "react-blurhash";
import { showAppBar, showBackButton } from "../../utils/slice/appBar";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import { BaseItemKind, ItemFields } from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { getVideosApi } from "@jellyfin/sdk/lib/utils/api/videos-api";

import { useQuery } from "@tanstack/react-query";

import { MdiPlayOutline } from "../../components/icons/mdiPlayOutline";
import { MdiStarHalfFull } from "../../components/icons/mdiStarHalfFull";
import { getRuntimeMusic, getRuntimeFull } from "../../utils/date/time";
import { TypeIconCollectionCard } from "../../components/utils/iconsCollection";

import { Card } from "../../components/card/card";
import { EpisodeCard } from "../../components/card/episodeCard";
import { CardScroller } from "../../components/cardScroller/cardScroller";

import "./item.module.scss";
import { MdiCheck } from "../../components/icons/mdiCheck";
import { MdiHeartOutline } from "../../components/icons/mdiHeartOutline";
import { MdiHeart } from "../../components/icons/mdiHeart";
import { EpisodeCardsSkeleton } from "../../components/skeleton/episodeCards";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";
import { MdiClockOutline } from "../../components/icons/mdiClockOutline";
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
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [isMovie, setIsMovie] = useState(false);
	const [isSeries, setIsSeries] = useState(false);
	const [isMusicItem, setIsMusicItem] = useState(false);
	const appBarVisiblity = useSelector((state) => state.appBar.visible);
	const [primageImageLoaded, setPrimaryImageLoaded] = useState(false);
	const [backdropImageLoaded, setBackdropImageLoaded] = useState(false);

	useEffect(() => {
		if (!appBarVisiblity) {
			dispatch(showAppBar());
		}
		dispatch(showBackButton());
	}, []);

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
			});
			return result.data;
		},
		enabled: !!user.data,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const similarItems = useQuery({
		queryKey: ["item", "similarItem", id],
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
		queryKey: ["item", "seasons", id],
		queryFn: async () => {
			const result = await getTvShowsApi(window.api).getSeasons({
				seriesId: item.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == "Series",
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const nextUpEpisode = useQuery({
		queryKey: ["item", "seasons", id, "nextUp"],
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
		queryKey: ["item", "episode", `season ${currentSeason + 1}`],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				parentId: seasons.data.Items[currentSeason].Id,
				fields: [ItemFields.SeasonUserData, "Overview"],
			});
			return result.data;
		},
		enabled: seasons.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
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

	// const videoStreams = useQuery({
	// 	queryKey: ["item", id, "videoTracks"],
	// 	queryFn: async () => {
	// 		const result = await getVideosApi(window.api).getVideoStream({
	// 			itemId: item.data.Id,
	// 		});
	// 		return result.data;
	// 	},
	// 	enabled: item.isSuccess,
	// 	networkMode: "always",
	// });

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
			<>
				<Box className="item-detail-backdrop">
					{item.data.BackdropImageTags.length != 0 && (
						<Blurhash
							hash={
								item.data.ImageBlurHashes.Backdrop[
									item.data.BackdropImageTags[0]
								]
							}
							width="100%"
							height="100%"
							resolutionX={14}
							resolutionY={22}
							style={{
								aspectRatio: "0.666",
							}}
							punch={1}
							className="item-detail-image-blurhash"
						/>
					)}
				</Box>
				<Box
					recomponent="main"
					className="scrollY"
					sx={{
						display: "flex",
						pt: 11,
						px: 3,
						pb: 3,
						position: "relative",
						flexFlow: "column",
					}}
				>
					<Box className="item-detail-header" mb={0}>
						<Box className="item-detail-header-backdrop">
							{item.data.Type != BaseItemKind.MusicAlbum
								? item.data.BackdropImageTags.length !=
										0 && (
										<img
											src={
												item.data.Type ==
												BaseItemKind.MusicAlbum
													? `${window.api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`
													: `${window.api.basePath}/Items/${item.data.Id}/Images/Backdrop`
											}
											style={{
												opacity: backdropImageLoaded
													? 1
													: 0,
											}}
											className="item-detail-image"
											onLoad={() =>
												setBackdropImageLoaded(
													true,
												)
											}
										/>
								  )
								: !!item.data.ParentBackdropItemId && (
										<img
											src={
												item.data.Type ==
												BaseItemKind.MusicAlbum
													? `${window.api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`
													: `${window.api.basePath}/Items/${item.data.Id}/Images/Backdrop`
											}
											style={{
												opacity: backdropImageLoaded
													? 1
													: 0,
											}}
											className="item-detail-image"
											onLoad={() =>
												setBackdropImageLoaded(
													true,
												)
											}
										/>
								  )}
							{item.data.BackdropImageTags.length != 0 && (
								<Blurhash
									hash={
										item.data.ImageBlurHashes
											.Backdrop[
											item.data
												.BackdropImageTags[0]
										]
									}
									width="100%"
									height="100%"
									resolutionX={12}
									resolutionY={18}
									style={{
										aspectRatio: "0.666",
									}}
									className="item-detail-image-blurhash"
								/>
							)}
							<Box
								sx={{ fontSize: "4em" }}
								className="item-detail-image-icon-container"
							>
								{TypeIconCollectionCard[item.data.Type]}
							</Box>
						</Box>

						<Box
							className="item-detail-info-container"
							sx={{
								display: "flex",
								gap: 3,
								flexDirection: "row",
								alignItems: "flex-end",
								justifyContent: "flex-start",
								width: "100%",
							}}
						>
							<Box
								className="item-detail-image-container"
								sx={
									item.data.Type.includes("Music")
										? {
												aspectRatio: "1",
										  }
										: {}
								}
							>
								<Chip
									className="card-indicator"
									label={<MdiCheck />}
									sx={{
										transition: "opacity 150ms",
										opacity: item.data.UserData
											.Played
											? 1
											: 0,
										top: 5,
										right: 5,
									}}
								/>
								{!!item.data.ImageTags.Primary && (
									<img
										src={
											window.api.basePath +
											"/Items/" +
											item.data.Id +
											"/Images/Primary?fillHeight=532&fillWidth=300&quality=96"
										}
										style={{
											opacity: primageImageLoaded
												? 1
												: 0,
										}}
										className="item-detail-image"
										onLoad={() =>
											setPrimaryImageLoaded(
												true,
											)
										}
									/>
								)}
								{!!item.data.ImageBlurHashes
									.Primary && (
									<Blurhash
										hash={
											item.data.ImageBlurHashes
												.Primary[
												item.data.ImageTags
													.Primary
											]
										}
										width="100%"
										height="100%"
										resolutionX={12}
										resolutionY={8}
										style={{
											aspectRatio: 0.666,
										}}
										className="item-detail-image-blurhash"
									/>
								)}
								<div className="item-detail-image-icon-container">
									{
										TypeIconCollectionCard[
											item.data.Type
										]
									}
								</div>
							</Box>
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
								}}
							>
								<Box
									className="item-detail-title-name"
									sx={{ mb: 1 }}
								>
									<Typography
										variant="h3"
										textOverflow="ellipsis"
										whiteSpace="nowrap"
										width="100%"
									>
										{!!item.data.ImageTags
											.Logo ? (
											<img
												className="item-detail-title-logo"
												src={`${window.api.basePath}/Items/${item.data.Id}/Images/Logo?quality=80&tag=${item.data.ImageTags.Logo}`}
											/>
										) : (
											item.data.Name
										)}
									</Typography>
									<Typography
										variant="subtitle1"
										color="gray"
									>
										{item.data.OriginalTitle}
									</Typography>
								</Box>
								<Stack
									direction="row"
									gap={2}
									divider={
										<Divider
											variant="middle"
											flexItem
											orientation="vertical"
										/>
									}
									sx={{
										alignItems: "center",
										width: "100%",
									}}
								>
									{item.data.ProductionYear && (
										<Typography
											sx={{ flexGrow: 0 }}
											variant="subtitle1"
										>
											{
												item.data
													.ProductionYear
											}
										</Typography>
									)}
									<Chip
										variant="outlined"
										label={
											!!item.data
												.OfficialRating
												? item.data
														.OfficialRating
												: "Not Rated"
										}
									/>
									<Box
										sx={{
											display: "flex",
											gap: "0.25em",
											alignItems: "center",
										}}
										className="item-detail-info-rating"
									>
										{!!item.data
											.CommunityRating ? (
											<>
												<MdiStarHalfFull />
												<Typography variant="subtitle1">
													{Math.round(
														item.data
															.CommunityRating *
															10,
													) / 10}
												</Typography>
											</>
										) : (
											<Typography variant="subtitle1">
												No Community Rating
											</Typography>
										)}
									</Box>
									{!!item.data.RunTimeTicks && (
										<Typography variant="subtitle1">
											{getRuntimeFull(
												item.data
													.RunTimeTicks,
											)}
										</Typography>
									)}
								</Stack>
							</Box>
							<Stack
								direction="row"
								gap={1}
								alignItems="center"
								justifyContent="center"
								ml="auto"
								mr={2}
							>
								{item.data.Type != "Person" &&
									item.data.Type !=
										"MusicArtist" && (
										<>
											<Button
												variant="contained"
												size="large"
												startIcon={
													<MdiPlayOutline />
												}
												sx={{
													position:
														"relative",
													overflow:
														"hidden",
												}}
												disabled
											>
												{!!item.data
													.UserData
													.PlayedPercentage &&
												item.data.UserData
													.PlayedPercentage >
													0
													? "Resume"
													: "Play"}
												{!!item.data
													.UserData
													.PlayedPercentage && (
													<LinearProgress
														variant="determinate"
														value={
															item
																.data
																.UserData
																.PlayedPercentage
														}
														color="white"
														sx={{
															position:
																"absolute",
															height: "100%",
															width: "100%",
															background:
																"transparent",
															zIndex: "0",
															opacity: 0.2,
														}}
													/>
												)}
											</Button>

											<IconButton
												onClick={
													handleMarkPlayedOrunPlayed
												}
											>
												<MdiCheck
													sx={{
														color: item
															.data
															.UserData
															.Played
															? green[400]
															: "white",
													}}
												/>
											</IconButton>
										</>
									)}
								<IconButton onClick={handleLiking}>
									{item.data.UserData.IsFavorite ? (
										<MdiHeart
											sx={{ color: pink[700] }}
										/>
									) : (
										<MdiHeartOutline />
									)}
								</IconButton>
							</Stack>
						</Box>
						<Box
							className="item-detail-tagline"
							sx={{ width: "100%" }}
						>
							<Typography
								variant="h5"
								fontStyle="italic"
								sx={{ opacity: 0.8 }}
							>
								{item.data.Taglines[0]}
							</Typography>
						</Box>
					</Box>
					{item.data.Genres != 0 && (
						<Box sx={{ mb: 2, width: "50%" }}>
							<Stack
								direction="row"
								gap={1}
								alignItems="center"
							>
								<Typography
									className="item-detail-heading"
									variant="h5"
									mr={2}
								>
									Genre
								</Typography>
								{item.data.Genres.map(
									(genre, index) => {
										return (
											<Chip
												key={index}
												variant="filled"
												label={genre}
											/>
										);
									},
								)}
							</Stack>
						</Box>
					)}

					{item.data.Type == BaseItemKind.MusicAlbum && (
						<Stack
							sx={{ mb: 2 }}
							direction="row"
							gap={1}
							alignItems="center"
						>
							<Typography
								className="item-detail-heading"
								variant="h5"
								mr={2}
							>
								Artists
							</Typography>
							<Stack
								direction="row"
								gap={0.5}
								divider={
									<Typography variant="h6">
										,
									</Typography>
								}
							>
								{item.data.Artists.map(
									(mitem, mindex) => {
										return (
											<Typography
												key={mindex}
												variant="h6"
											>
												{mitem}
											</Typography>
										);
									},
								)}
							</Stack>
						</Stack>
					)}

					{!!item.data.MediaStreams &&
						item.data.MediaStreams.length != 0 && (
							<>
								<Box sx={{ mb: 2, width: "50%" }}>
									<Stack
										direction="row"
										gap={1}
										alignItems="center"
									>
										<Typography
											className="item-detail-heading"
											variant="h5"
											mr={2}
										>
											Video
										</Typography>
										<TextField
											defaultValue={
												item.data
													.MediaStreams[0]
													.DisplayTitle
											}
											select
											fullWidth
											hiddenLabel
										>
											{item.data.MediaStreams.map(
												(
													stream,
													sindex,
												) => {
													if (
														stream.Type ==
														BaseItemKind.Video
													)
														return (
															<MenuItem
																key={
																	sindex
																}
																value={
																	stream.DisplayTitle
																}
															>
																{
																	stream.DisplayTitle
																}
															</MenuItem>
														);
												},
											)}
										</TextField>
									</Stack>
								</Box>
								<Box sx={{ mb: 2, width: "50%" }}>
									<Stack
										direction="row"
										gap={1}
										alignItems="center"
									>
										<Typography
											className="item-detail-heading"
											variant="h5"
											mr={2}
										>
											Audio
										</Typography>
										<TextField
											select
											fullWidth
											hiddenLabel
										>
											{item.data.MediaStreams.map(
												(
													stream,
													sindex,
												) => {
													if (
														stream.Type ==
														BaseItemKind.Audio
													)
														return (
															<MenuItem
																key={
																	sindex
																}
																value={
																	stream.DisplayTitle
																}
															>
																{
																	stream.DisplayTitle
																}
															</MenuItem>
														);
												},
											)}
										</TextField>
									</Stack>
								</Box>
							</>
						)}

					{!!item.data.Overview && (
						<Box mt={3}>
							<Typography variant="h5" mb={1}>
								Overview
							</Typography>
							<Typography
								variant="body1"
								sx={{ opacity: 0.8 }}
								mb={5}
							>
								{item.data.Overview}
							</Typography>
						</Box>
					)}

					{item.data.Type == BaseItemKind.MusicAlbum && (
						<TableContainer
							component={Paper}
							sx={{ mb: 2, borderRadius: "15px" }}
						>
							<Table>
								<TableHead
									sx={{
										mb: 1,
									}}
								>
									<TableRow>
										<TableCell
											sx={{
												maxWidth: 120,
												width: 20,
											}}
										>
											<Typography variant="h6">
												#
											</Typography>
										</TableCell>
										<TableCell
											sx={{ width: 20 }}
										></TableCell>
										<TableCell>
											<Typography variant="h6">
												Name
											</Typography>
										</TableCell>
										<TableCell>
											<Typography
												variant="h6"
												align="right"
											>
												<MdiClockOutline />
											</Typography>
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{musicTracks.isSuccess &&
										musicTracks.data.Items.map(
											(mitem, mindex) => {
												return (
													<TableRow
														key={
															mindex
														}
														sx={{
															"&:last-child td, &:last-child th":
																{
																	border: 0,
																},
															"&:hover":
																{
																	background:
																		"rgb(255 255 255 / 0.05)",
																},
														}}
													>
														<TableCell
															sx={{
																maxWidth: 120,
																width: 20,
															}}
														>
															<Typography variant="body1">
																{
																	mitem.IndexNumber
																}
															</Typography>
														</TableCell>
														<TableCell
															sx={{
																width: 20,
															}}
															align="center"
														>
															<IconButton
																onClick={() =>
																	handleLikingTrack(
																		mitem,
																	)
																}
															>
																{mitem
																	.UserData
																	.IsFavorite ? (
																	<MdiHeart />
																) : (
																	<MdiHeartOutline />
																)}
															</IconButton>
														</TableCell>
														<TableCell>
															<Typography variant="body1">
																{
																	mitem.Name
																}
															</Typography>
														</TableCell>
														<TableCell align="right">
															<Typography variant="body1">
																{getRuntimeMusic(
																	mitem.RunTimeTicks,
																)}
															</Typography>
														</TableCell>
													</TableRow>
												);
											},
										)}
								</TableBody>
							</Table>
						</TableContainer>
					)}

					{item.data.Type == BaseItemKind.Person &&
						personShows.isSuccess &&
						personMovies.isSuccess &&
						personBooks.isSuccess &&
						personPhotos.isSuccess &&
						personEpisodes.isSuccess && (
							<Box>
								<Box
									sx={{
										borderBottom: 1,
										borderColor: "divider",
									}}
								>
									<Tabs
										value={activePersonTab}
										onChange={(e, newVal) =>
											setActivePersonTab(
												newVal,
											)
										}
										aria-label="person-tabs"
									>
										{personTabs.map(
											(pitem, index) => {
												return (
													<Tab
														label={
															pitem
														}
														{...a11yProps(
															index,
														)}
														disabled={
															(pitem ==
																"Movies" &&
																personMovies
																	.data
																	.Items
																	.length ==
																	0) ||
															(pitem ==
																"TV Shows" &&
																personShows
																	.data
																	.Items
																	.length ==
																	0) ||
															(pitem ==
																"Books" &&
																personBooks
																	.data
																	.Items
																	.length ==
																	0) ||
															(pitem ==
																"Photos" &&
																personPhotos
																	.data
																	.Items
																	.length ==
																	0) ||
															(pitem ==
																"Episodes" &&
																personEpisodes
																	.data
																	.Items
																	.length ==
																	0)
																? true
																: false
														}
														key={
															index
														}
													/>
												);
											},
										)}
									</Tabs>
								</Box>
								{personTabs.map((pitem, index) => {
									return (
										<TabPanel
											value={activePersonTab}
											index={index}
											key={index}
										>
											{pitem == "Movies" && (
												<Grid2
													container
													columns={{
														xs: 2,
														sm: 4,
														md: 8,
													}}
												>
													{personMovies.data.Items.map(
														(
															mitem,
															mindex,
														) => {
															return (
																<Grid2
																	key={
																		mindex
																	}
																	xs={
																		1
																	}
																	sm={
																		1
																	}
																	md={
																		1
																	}
																>
																	<Card
																		itemName={
																			mitem.Name
																		}
																		itemId={
																			mitem.Id
																		}
																		imageTags={
																			!!mitem
																				.ImageTags
																				.Primary
																		}
																		subText={
																			mitem.ProductionYear
																		}
																		iconType={
																			mitem.Type
																		}
																		playedPercent={
																			!!mitem.UserData
																				? mitem
																						.UserData
																						.PlayedPercentage
																				: 0
																		}
																		cardOrientation={
																			mitem.Type ==
																				"MusicArtist" ||
																			mitem.Type ==
																				"MusicAlbum" ||
																			mitem.Type ==
																				"MusicGenre" ||
																			mitem.Type ==
																				"Playlist"
																				? "square"
																				: "portait"
																		}
																		watchedStatus={
																			!!mitem.UserData
																				? mitem
																						.UserData
																						.Played
																				: false
																		}
																		watchedCount={
																			!!mitem.UserData &&
																			mitem
																				.UserData
																				.UnplayedItemCount
																		}
																		blurhash={
																			mitem.ImageBlurHashes ==
																			{}
																				? ""
																				: !!mitem
																						.ImageTags
																						.Primary
																				? !!mitem
																						.ImageBlurHashes
																						.Primary
																					? mitem
																							.ImageBlurHashes
																							.Primary[
																							mitem
																								.ImageTags
																								.Primary
																					  ]
																					: ""
																				: ""
																		}
																		currentUser={
																			user.data
																		}
																		onClickEvent={() => {
																			navigate(
																				`/item/${mitem.Id}`,
																			);
																		}}
																	></Card>
																</Grid2>
															);
														},
													)}
												</Grid2>
											)}
											{pitem == "TV Shows" && (
												<Grid2
													container
													columns={{
														xs: 4,
														sm: 6,
														md: 8,
													}}
												>
													{personShows.data.Items.map(
														(
															mitem,
															mindex,
														) => {
															return (
																<Grid2
																	key={
																		mindex
																	}
																	xs={
																		1
																	}
																	sm={
																		1
																	}
																	md={
																		1
																	}
																>
																	<Card
																		itemName={
																			mitem.Name
																		}
																		itemId={
																			mitem.Id
																		}
																		imageTags={
																			!!mitem
																				.ImageTags
																				.Primary
																		}
																		subText={
																			mitem.ProductionYear
																		}
																		iconType={
																			mitem.Type
																		}
																		playedPercent={
																			!!mitem.UserData
																				? mitem
																						.UserData
																						.PlayedPercentage
																				: 0
																		}
																		cardOrientation={
																			mitem.Type ==
																				"MusicArtist" ||
																			mitem.Type ==
																				"MusicAlbum" ||
																			mitem.Type ==
																				"MusicGenre" ||
																			mitem.Type ==
																				"Playlist"
																				? "square"
																				: "portait"
																		}
																		watchedStatus={
																			!!mitem.UserData
																				? mitem
																						.UserData
																						.Played
																				: false
																		}
																		watchedCount={
																			!!mitem.UserData &&
																			mitem
																				.UserData
																				.UnplayedItemCount
																		}
																		blurhash={
																			mitem.ImageBlurHashes ==
																			{}
																				? ""
																				: !!mitem
																						.ImageTags
																						.Primary
																				? !!mitem
																						.ImageBlurHashes
																						.Primary
																					? mitem
																							.ImageBlurHashes
																							.Primary[
																							mitem
																								.ImageTags
																								.Primary
																					  ]
																					: ""
																				: ""
																		}
																		currentUser={
																			user.data
																		}
																		onClickEvent={() => {
																			navigate(
																				`/item/${mitem.Id}`,
																			);
																		}}
																	></Card>
																</Grid2>
															);
														},
													)}
												</Grid2>
											)}
											{pitem == "Books" && (
												<Grid2
													container
													columns={{
														xs: 4,
														sm: 6,
														md: 8,
													}}
												>
													{personBooks.data.Items.map(
														(
															mitem,
															mindex,
														) => {
															return (
																<Grid2
																	key={
																		mindex
																	}
																	xs={
																		1
																	}
																	sm={
																		1
																	}
																	md={
																		1
																	}
																>
																	<Card
																		itemName={
																			mitem.Name
																		}
																		itemId={
																			mitem.Id
																		}
																		imageTags={
																			!!mitem
																				.ImageTags
																				.Primary
																		}
																		subText={
																			mitem.ProductionYear
																		}
																		iconType={
																			mitem.Type
																		}
																		playedPercent={
																			!!mitem.UserData
																				? mitem
																						.UserData
																						.PlayedPercentage
																				: 0
																		}
																		cardOrientation={
																			mitem.Type ==
																				"MusicArtist" ||
																			mitem.Type ==
																				"MusicAlbum" ||
																			mitem.Type ==
																				"MusicGenre" ||
																			mitem.Type ==
																				"Playlist"
																				? "square"
																				: "portait"
																		}
																		watchedStatus={
																			!!mitem.UserData
																				? mitem
																						.UserData
																						.Played
																				: false
																		}
																		watchedCount={
																			!!mitem.UserData &&
																			mitem
																				.UserData
																				.UnplayedItemCount
																		}
																		blurhash={
																			mitem.ImageBlurHashes ==
																			{}
																				? ""
																				: !!mitem
																						.ImageTags
																						.Primary
																				? !!mitem
																						.ImageBlurHashes
																						.Primary
																					? mitem
																							.ImageBlurHashes
																							.Primary[
																							mitem
																								.ImageTags
																								.Primary
																					  ]
																					: ""
																				: ""
																		}
																		currentUser={
																			user.data
																		}
																		onClickEvent={() => {
																			navigate(
																				`/item/${mitem.Id}`,
																			);
																		}}
																	></Card>
																</Grid2>
															);
														},
													)}
												</Grid2>
											)}
											{pitem == "Photos" && (
												<Grid2
													container
													columns={{
														xs: 4,
														sm: 6,
														md: 8,
													}}
												>
													{personPhotos.data.Items.map(
														(
															mitem,
															mindex,
														) => {
															return (
																<Grid2
																	key={
																		mindex
																	}
																	xs={
																		1
																	}
																	sm={
																		1
																	}
																	md={
																		1
																	}
																>
																	<Card
																		itemName={
																			mitem.Name
																		}
																		itemId={
																			mitem.Id
																		}
																		imageTags={
																			!!mitem
																				.ImageTags
																				.Primary
																		}
																		subText={
																			mitem.ProductionYear
																		}
																		iconType={
																			mitem.Type
																		}
																		playedPercent={
																			!!mitem.UserData
																				? mitem
																						.UserData
																						.PlayedPercentage
																				: 0
																		}
																		cardOrientation={
																			mitem.Type ==
																				"MusicArtist" ||
																			mitem.Type ==
																				"MusicAlbum" ||
																			mitem.Type ==
																				"MusicGenre" ||
																			mitem.Type ==
																				"Playlist"
																				? "square"
																				: "portait"
																		}
																		watchedStatus={
																			!!mitem.UserData
																				? mitem
																						.UserData
																						.Played
																				: false
																		}
																		watchedCount={
																			!!mitem.UserData &&
																			mitem
																				.UserData
																				.UnplayedItemCount
																		}
																		blurhash={
																			mitem.ImageBlurHashes ==
																			{}
																				? ""
																				: !!mitem
																						.ImageTags
																						.Primary
																				? !!mitem
																						.ImageBlurHashes
																						.Primary
																					? mitem
																							.ImageBlurHashes
																							.Primary[
																							mitem
																								.ImageTags
																								.Primary
																					  ]
																					: ""
																				: ""
																		}
																		currentUser={
																			user.data
																		}
																		onClickEvent={() => {
																			navigate(
																				`/item/${mitem.Id}`,
																			);
																		}}
																	></Card>
																</Grid2>
															);
														},
													)}
												</Grid2>
											)}
											{pitem == "Episodes" && (
												<Grid2
													container
													columns={{
														xs: 2,
														sm: 3,
														md: 4,
													}}
												>
													{personEpisodes.data.Items.map(
														(
															mitem,
															mindex,
														) => {
															return (
																<Grid2
																	key={
																		mindex
																	}
																	xs={
																		1
																	}
																	sm={
																		1
																	}
																	md={
																		1
																	}
																>
																	<EpisodeCard
																		itemId={
																			mitem.Id
																		}
																		itemName={
																			mitem.Name
																		}
																		imageTags={
																			!!mitem
																				.ImageTags
																				.Primary
																		}
																		subText={
																			mitem.Overview
																		}
																		playedPercent={
																			mitem
																				.UserData
																				.PlayedPercentage
																		}
																		watchedStatus={
																			mitem
																				.UserData
																				.Played
																		}
																		blurhash={
																			mitem.ImageBlurHashes ==
																			{}
																				? ""
																				: !!mitem
																						.ImageTags
																						.Primary
																				? !!mitem
																						.ImageBlurHashes
																						.Primary
																					? mitem
																							.ImageBlurHashes
																							.Primary[
																							mitem
																								.ImageTags
																								.Primary
																					  ]
																					: ""
																				: ""
																		}
																		currentUser={
																			user.data
																		}
																		favourite={
																			mitem
																				.UserData
																				.IsFavorite
																		}
																		showName={
																			mitem.SeriesName
																		}
																		episodeLocation={`S${mitem.ParentIndexNumber}:E${mitem.IndexNumber}`}
																		parentId={
																			mitem.SeriesId
																		}
																	/>
																</Grid2>
															);
														},
													)}
												</Grid2>
											)}
										</TabPanel>
									);
								})}
							</Box>
						)}

					{nextUpEpisode.isSuccess && (
						<Grid2
							container
							columns={{
								xs: 2,
								sm: 3,
								md: 4,
							}}
						>
							{nextUpEpisode.data.Items.map(
								(mitem, mindex) => {
									return (
										<Grid2
											key={mindex}
											xs={1}
											sm={1}
											md={1}
										>
											<EpisodeCard
												itemId={mitem.Id}
												itemName={`${mitem.IndexNumber}. ${mitem.Name}`}
												imageTags={
													!!mitem
														.ImageTags
														.Primary
												}
												playedPercent={
													mitem.UserData
														.PlayedPercentage
												}
												watchedStatus={
													mitem.UserData
														.Played
												}
												favourite={
													mitem.UserData
														.IsFavorite
												}
												blurhash={
													mitem.ImageBlurHashes ==
													{}
														? ""
														: !!mitem
																.ImageTags
																.Primary
														? !!mitem
																.ImageBlurHashes
																.Primary
															? mitem
																	.ImageBlurHashes
																	.Primary[
																	mitem
																		.ImageTags
																		.Primary
															  ]
															: ""
														: ""
												}
												currentUser={
													user.data
												}
												centerAlignText
											/>
										</Grid2>
									);
								},
							)}
						</Grid2>
					)}

					{seasons.isSuccess && (
						<Box sx={{ mb: 2 }}>
							<Tabs
								variant="scrollable"
								scrollButtons="auto"
								value={currentSeason}
								onChange={(e, newVal) => {
									setCurrentSeason(newVal);
								}}
								sx={{ mb: 2 }}
								selectionFollowsFocus
							>
								{seasons.data.Items.map(
									(season, index) => {
										return (
											<Tab
												label={season.Name}
												{...a11yProps(
													index,
												)}
												key={index}
											/>
										);
									},
								)}
							</Tabs>
							{seasons.data.Items.map((season, index) => {
								return (
									<TabPanel
										value={currentSeason}
										index={index}
										key={index}
									>
										<Grid2
											container
											columns={{
												xs: 2,
												sm: 3,
												md: 4,
											}}
										>
											{episodes.isLoading ? (
												<EpisodeCardsSkeleton />
											) : (
												episodes.data.Items.map(
													(
														mitem,
														mindex,
													) => {
														return (
															<Grid2
																key={
																	mindex
																}
																xs={
																	1
																}
																sm={
																	1
																}
																md={
																	1
																}
															>
																<EpisodeCard
																	itemId={
																		mitem.Id
																	}
																	itemName={`${mitem.IndexNumber}. ${mitem.Name}`}
																	imageTags={
																		!!mitem
																			.ImageTags
																			.Primary
																	}
																	subText={
																		mitem.Overview
																	}
																	playedPercent={
																		mitem
																			.UserData
																			.PlayedPercentage
																	}
																	watchedStatus={
																		mitem
																			.UserData
																			.Played
																	}
																	favourite={
																		mitem
																			.UserData
																			.IsFavorite
																	}
																	blurhash={
																		mitem.ImageBlurHashes ==
																		{}
																			? ""
																			: !!mitem
																					.ImageTags
																					.Primary
																			? !!mitem
																					.ImageBlurHashes
																					.Primary
																				? mitem
																						.ImageBlurHashes
																						.Primary[
																						mitem
																							.ImageTags
																							.Primary
																				  ]
																				: ""
																			: ""
																	}
																	currentUser={
																		user.data
																	}
																	itemTicks={
																		mitem.RunTimeTicks
																	}
																	itemRating={
																		mitem.CommunityRating
																	}
																/>
															</Grid2>
														);
													},
												)
											)}
										</Grid2>
									</TabPanel>
								);
							})}
						</Box>
					)}

					{item.data.People.length != 0 && (
						<CardScroller
							headingProps={{
								variant: "h5",
								fontSize: "1.8em",
							}}
							displayCards={8}
							title="Cast"
							disableDecoration
						>
							{item.data.People.map((person, index) => {
								return (
									<Card
										key={index}
										itemName={person.Name}
										itemId={person.Id}
										// imageTags={false}
										imageTags={
											!!person.PrimaryImageTag
										}
										iconType="Person"
										subText={person.Role}
										cardOrientation="sqaure"
										currentUser={user.data}
									/>
								);
							})}
						</CardScroller>
					)}

					{similarItems.data.Items.length != 0 && (
						<CardScroller
							headingProps={{
								variant: "h5",
								fontSize: "1.8em",
							}}
							displayCards={8}
							title={`More Like This`}
							disableDecoration
						>
							{similarItems.data.Items.map(
								(simItem, index) => {
									return (
										<Card
											key={index}
											itemName={simItem.Name}
											itemId={simItem.Id}
											// imageTags={false}
											imageTags={
												!!simItem.ImageTags
													.Primary
											}
											iconType={simItem.Type}
											subText={
												simItem.ProductionYear
											}
											playedPercent={
												!!simItem.UserData
													? simItem
															.UserData
															.PlayedPercentage
													: 0
											}
											cardOrientation={
												simItem.Type ==
													"MusicArtist" ||
												simItem.Type ==
													"MusicAlbum" ||
												simItem.Type ==
													"MusicGenre" ||
												simItem.Type ==
													"Playlist"
													? "square"
													: "portait"
											}
											currentUser={user.data}
											blurhash={
												simItem.ImageBlurHashes ==
												{}
													? ""
													: !!simItem
															.ImageTags
															.Primary
													? !!simItem
															.ImageBlurHashes
															.Primary
														? simItem
																.ImageBlurHashes
																.Primary[
																simItem
																	.ImageTags
																	.Primary
														  ]
														: ""
													: ""
											}
											watchedStatus={
												!!simItem.UserData
													? simItem
															.UserData
															.Played
													: false
											}
											watchedCount={
												!!simItem.UserData &&
												simItem.UserData
													.UnplayedItemCount
											}
											onClickEvent={() => {
												navigate(
													`/item/${simItem.Id}`,
												);
											}}
										/>
									);
								},
							)}
						</CardScroller>
					)}
				</Box>
			</>
		);
	}
	if (item.isError || similarItems.isError) {
		return <ErrorNotice />;
	}
};

export default ItemDetail;