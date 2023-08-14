/** @format */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import useScrollTrigger from "@mui/material/useScrollTrigger";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Unstable_Grid2";
import Stack from "@mui/material/Stack";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import Pagination from "@mui/material/Pagination";

import { theme } from "../../theme";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getArtistsApi } from "@jellyfin/sdk/lib/utils/api/artists-api";
import { getGenresApi } from "@jellyfin/sdk/lib/utils/api/genres-api";
import { getMusicGenresApi } from "@jellyfin/sdk/lib/utils/api/music-genres-api";
import { getStudiosApi } from "@jellyfin/sdk/lib/utils/api/studios-api";
import { getPersonsApi } from "@jellyfin/sdk/lib/utils/api/persons-api";

import { Card } from "../../components/card/card";
import { EmptyNotice } from "../../components/notices/emptyNotice/emptyNotice";

import { MdiSortDescending } from "../../components/icons/mdiSortDescending";
import { MdiSortAscending } from "../../components/icons/mdiSortAscending";
import { MdiChevronDown } from "../../components/icons/mdiChevronDown";
import { MdiFilterOutline } from "../../components/icons/mdiFilterOutline";

import { clrBackgroundDarkOpacity0_8 } from "../../palette.module.scss";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";
import {
	BaseItemKind,
	ItemFields,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getRuntimeMusic } from "../../utils/date/time";

import "./library.module.scss";
import { MdiMusic } from "../../components/icons/mdiMusic";
import { MdiHeart } from "../../components/icons/mdiHeart";
import { MdiHeartOutline } from "../../components/icons/mdiHeartOutline";
import { useBackdropStore } from "../../utils/store/backdrop";

const LibraryView = () => {
	const navigate = useNavigate();

	const [page, setPage] = useState(1);
	const maxDisplayItems = 50;

	const { id } = useParams();

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});

	const [sortAscending, setSortAscending] = useState(true);
	const [sortBy, setSortBy] = useState();
	const [sortByData, setSortByData] = useState();

	const handleSortChange = (e) => {
		setSortAscending(e.target.checked);
		console.log(e.target.checked);
	};
	const handleSortBy = (e) => {
		setSortBy(e.target.value);
	};

	const fetchLib = async (libraryId) => {
		const result = await getItemsApi(window.api).getItems({
			userId: user.data.Id,
			ids: [libraryId],
			fields: [ItemFields.RecursiveItemCount],
		});
		return result.data;
	};
	const currentLib = useQuery({
		queryKey: ["libraryView", "currentLib", id],
		queryFn: () => fetchLib(id),
		enabled: !!user.data,
		networkMode: "always",
	});

	const [isPlayed, setIsPlayed] = useState(false);
	const [isUnPlayed, setIsUnPlayed] = useState(false);
	const [isResumable, setIsResumable] = useState(false);
	const [isFavorite, setisFavorite] = useState(false);
	const [isLiked, setIsLiked] = useState(false);
	const [isUnliked, setIsUnliked] = useState(false);
	const availableWatchStatus = [
		{
			title: "Played",
			value: false,
			state: (val) => setIsPlayed(val),
		},
		{
			title: "Unplayed",
			value: false,
			state: (val) => setIsUnPlayed(val),
		},
		{
			title: "Resumable",
			value: false,
			state: (val) => setIsResumable(val),
		},
		{
			title: "Favourite",
			value: false,
			state: (val) => setisFavorite(val),
		},
		{
			title: "Liked",
			value: false,
			state: (val) => setIsLiked(val),
		},
		{
			title: "UnLiked",
			value: false,
			state: (val) => setIsUnliked(val),
		},
	];

	const [hasSubtitles, setHasSubtitles] = useState(false);
	const [hasTrailer, setHasTrailer] = useState(false);
	const [hasSpecialFeature, setHasSpecialFeature] = useState(false);
	const [hasThemeSong, setHasThemeSong] = useState(false);
	const [hasThemeVideo, setHasThemeVideo] = useState(false);
	const availableFeatureFilters = [
		{
			title: "Subtitles",
			value: false,
			state: (val) => setHasSubtitles(val),
		},
		{
			title: "Trailer",
			value: false,
			state: (val) => setHasTrailer(val),
		},
		{
			title: "Special Feature",
			value: false,
			state: (val) => setHasSpecialFeature(val),
		},
		{
			title: "Theme Song",
			value: false,
			state: (val) => setHasThemeSong(val),
		},
		{
			title: "Theme Video",
			vslue: false,
			state: (val) => setHasThemeVideo(val),
		},
	];

	const [isBluRay, setIsBluRay] = useState(false);
	const [isDVD, setIsDVD] = useState(false);
	const [isHD, setIsHD] = useState(false);
	const [is4K, setIs4K] = useState(false);
	const [is3D, setIs3D] = useState(false);
	const availableVideoTypeFilters = [
		{ title: "Blu-Ray", value: false, state: (val) => setIsBluRay(val) },
		{ title: "DVD", value: false, state: (val) => setIsDVD(val) },
		{ title: "HD", value: false, state: (val) => setIsHD(val) },
		{ title: "4K", value: false, state: (val) => setIs4K(val) },
		{ title: "3D", value: false, state: (val) => setIs3D(val) },
	];

	const [currentViewType, setCurrentViewType] = useState(undefined);
	const [viewType, setViewType] = useState([]);
	useEffect(() => {
		if (currentLib.isSuccess) {
			if (currentLib.data.Items[0].CollectionType == "movies") {
				setViewType([
					{ title: "Movies", value: BaseItemKind.Movie },
					{ title: "Collections", value: BaseItemKind.BoxSet },
					{ title: "Actors", value: BaseItemKind.Person },
					{ title: "Genres", value: BaseItemKind.Genre },
					{ title: "Studios", value: BaseItemKind.Studio },
				]);
			} else if (currentLib.data.Items[0].CollectionType == "music") {
				setViewType([
					{ title: "Albums", value: BaseItemKind.MusicAlbum },
					{ title: "Songs", value: BaseItemKind.Audio },
					{ title: "Artists", value: BaseItemKind.MusicArtist },
					{ title: "Genres", value: BaseItemKind.MusicGenre },
				]);
			} else if (
				currentLib.data.Items[0].CollectionType == "tvshows"
			) {
				setViewType([
					{ title: "Series", value: BaseItemKind.Series },
					{ title: "Actors", value: BaseItemKind.Person },
					{ title: "Genres", value: BaseItemKind.Genre },
					{ title: "Networks", value: BaseItemKind.Studio },
				]);
			} else {
				setViewType([]);
			}

			if (currentLib.data.Items[0].CollectionType == "movies") {
				setSortByData([
					{ title: "Name", value: "SortName" },
					{ title: "Critic Rating", value: "CriticRating" },
					{ title: "Rating", value: "CommunityRating" },
					{ title: "Date Added", value: "DateCreated" },
					{ title: "Play Count", value: "PlayCount" },
					{ title: "Release Date", value: "PremiereDate" },
					{ title: "Runtime", value: "Runtime" },
					{ title: "Random", value: "Random" },
				]);
			} else if (
				currentLib.data.Items[0].CollectionType == "tvshows"
			) {
				setSortByData([
					{ title: "Name", value: "SortName" },
					{ title: "Critic Rating", value: "CriticRating" },
					{ title: "Rating", value: "CommunityRating" },
					{ title: "Date Added", value: "DateCreated" },
					{ title: "Date Played", value: "DatePlayed" },
					{ title: "Release Date", value: "PremiereDate" },
					{ title: "Random", value: "Random" },
				]);
			} else if (currentLib.data.Items[0].CollectionType == "music") {
				setSortByData([
					{ title: "Name", value: "Name" },
					{ title: "Album Artist", value: "AlbumArtist" },
					{ title: "Critic Rating", value: "CriticRating" },
					{ title: "Rating", value: "CommunityRating" },
					{ title: "Release Date", value: "PremiereDate" },
					{ title: "Date Added", value: "DateCreated" },
					{ title: "Play Count", value: "PlayCount" },
					{ title: "Runtime", value: "Runtime" },
					{ title: "Random", value: "Random" },
				]);
			} else {
				setSortByData([
					{ title: "Name", value: "SortName" },
					{ title: "Critic Rating", value: "CriticRating" },
					{ title: "Rating", value: "CommunityRating" },
					{ title: "Release Date", value: "PremiereDate" },
					{ title: "Date Added", value: "DateCreated" },
					{ title: "Play Count", value: "PlayCount" },
					{ title: "Runtime", value: "Runtime" },
					{ title: "Random", value: "Random" },
				]);
			}
		}
	}, [currentLib.isSuccess]);

	useEffect(() => {
		if (sortByData != undefined) {
			setSortBy(sortByData[0].value);
		}
	}, [sortByData]);

	const fetchLibItems = async (libraryId) => {
		let result;
		if (currentViewType == "MusicArtist") {
			result = await getArtistsApi(window.api).getAlbumArtists({
				userId: user.data.Id,
				parentId: libraryId,
			});
		} else if (currentViewType == "Person") {
			result = await getPersonsApi(window.api).getPersons({
				userId: user.data.Id,
				personTypes: ["Actor"],
			});
		} else if (currentViewType == "Genre") {
			result = await getGenresApi(window.api).getGenres({
				userId: user.data.Id,
				parentId: libraryId,
			});
		} else if (currentViewType == "MusicGenre") {
			result = await getMusicGenresApi(window.api).getMusicGenres({
				userId: user.data.Id,
				parentId: libraryId,
			});
		} else if (currentViewType == "Studio") {
			result = await getStudiosApi(window.api).getStudios({
				userId: user.data.Id,
				parentId: libraryId,
			});
		} else {
			result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				parentId: libraryId,
				recursive:
					currentLib.data.Items[0].CollectionType ===
						"homevideos" ||
					currentLib.data.Items[0].Type === "Folder" ||
					(currentLib.data.Items[0].Type ===
						"CollectionFolder" &&
						!("CollectionType" in currentLib.data.Items[0]))
						? undefined
						: true,
				includeItemTypes: [currentViewType],
				sortOrder: [
					sortAscending
						? SortOrder.Ascending
						: SortOrder.Descending,
				],
				sortBy: sortBy,
				filters: [
					isPlayed && "IsPlayed",
					isUnPlayed && "IsUnplayed",
					isResumable && "IsResumable",
					isFavorite && "IsFavorite",
					isLiked && "IsFavoriteOrLikes",
					isUnliked && "Dislikes",
				],
				hasSubtitles: hasSubtitles ? true : undefined,
				hasTrailer: hasTrailer ? true : undefined,
				hasSpecialFeature: hasSpecialFeature ? true : undefined,
				hasThemeSong: hasThemeSong ? true : undefined,
				hasThemeVideo: hasThemeVideo ? true : undefined,
				videoTypes: [isBluRay && "BluRay", isDVD && "Dvd"],
				isHd: isHD ? true : undefined,
				is4K: is4K ? true : undefined,
				is3D: is3D ? true : undefined,
				startIndex: maxDisplayItems * (page - 1),
				limit: maxDisplayItems,
			});
		}
		return result.data;
	};

	const items = useQuery({
		queryKey: [
			"libraryView",
			"currentLibItems",
			id,
			`page: ${page}`,
			[
				currentViewType,

				sortAscending ? SortOrder.Ascending : SortOrder.Descending,
				,
				sortBy,
				[
					isPlayed,
					isUnPlayed,
					isResumable,
					isFavorite,
					isLiked,
					isUnliked,
				],
				[
					hasSubtitles,
					hasTrailer,
					hasSpecialFeature,
					hasThemeSong,
					hasThemeVideo,
				],
				[isBluRay, isDVD, isHD, is4K, is3D],
			],
		],
		queryFn: () => fetchLibItems(id),
		enabled: currentLib.isSuccess,
		networkMode: "always",
		keepPreviousData: false,
		cacheTime: 0,
	});

	const handleCurrentViewType = (e) => {
		setCurrentViewType(e.target.value);
	};

	useEffect(() => {
		if (viewType.length != 0) {
			setCurrentViewType(viewType[0].value);
		}
	}, [viewType]);

	const disabledSortViews = [
		"MusicArtist",
		"Person",
		"Genre",
		"MusicGenre",
		"MusicGenre",
		"Studio",
	];
	const allowedFilterViews = ["movies", "tvshows", "music", "books"];
	const onlyStatusFilterViews = ["books", "music"];

	const [filterButtonAnchorEl, setFilterButtonAnchorEl] = useState(null);
	const filterMenuOpen = Boolean(filterButtonAnchorEl);
	const openFiltersMenu = (event) => {
		setFilterButtonAnchorEl(event.currentTarget);
	};
	const closeFiltersMenu = () => {
		setFilterButtonAnchorEl(null);
	};

	const trigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 1,
	});

	const handleLiking = async (item) => {
		let result;
		if (item.UserData.isFavorite) {
			result = await getUserLibraryApi(window.api).unmarkFavoriteItem({
				userId: user.data.Id,
				itemId: item.Id,
			});
		} else if (!item.UserData.isFavorite) {
			result = await getUserLibraryApi(window.api).markFavoriteItem({
				userId: user.data.Id,
				itemId: item.Id,
			});
		}
		items.refetch();
	};

	const disablePaginationViews = [
		"MusicArtist",
		"Person",
		"Genre",
		"MusicGenre",
		"Studio",
	];

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	useState(() => {
		// Remove App backdrop in library page
		setAppBackdrop("", "");
	}, []);

	return (
		<Box
			sx={{
				display: "flex",
			}}
		>
			<Box
				component="main"
				className="scrollY"
				sx={{
					flexGrow: 1,
					pt: 19,
					px: 3,
					pb: 3,
					position: "relative",
				}}
			>
				<AppBar
					position="fixed"
					elevation={trigger ? 1 : 0}
					sx={{
						width: `calc(100vw - ${theme.spacing(7)} - 10px)`,
						top: `${8 * 8}px !important`,
						backdropFilter: trigger ? `blur(30px)` : "none",
						background: "transparent",
						backgroundColor: trigger
							? `${clrBackgroundDarkOpacity0_8} !important`
							: "transparent",
						transition:
							"transition: background-color 150ms, box-shadow 150ms, backdrop-filter 150ms !important",
					}}
				>
					<Divider
						sx={{
							transform: trigger
								? "scaleX(1)"
								: "scaleX(0)",
							transition: "transform 150ms",
							transformOrigin: "left",
							transitionDelay: "50ms",
						}}
					/>
					<Toolbar sx={{ justifyContent: "space-between" }}>
						<Stack alignItems="center" direction="row">
							<Typography
								variant="h5"
								sx={{ mr: 2, flexShrink: 0 }}
								noWrap
							>
								{currentLib.isLoading ? (
									<CircularProgress sx={{ p: 1 }} />
								) : (
									currentLib.data.Items[0].Name
								)}
							</Typography>
							<Chip
								label={
									items.isLoading ? (
										<CircularProgress
											sx={{ p: 1.5 }}
										/>
									) : (
										items.data.TotalRecordCount
									)
								}
							/>
						</Stack>

						{/* <InputLabel id="demo-simple-select-label">
								Age
							</InputLabel> */}
						<Stack
							direction="row"
							spacing={2}
							divider={
								<Divider
									orientation="vertical"
									flexItem
									variant="inset"
								/>
							}
						>
							{currentLib.isSuccess &&
								allowedFilterViews.includes(
									currentLib.data.Items[0]
										.CollectionType,
								) && (
									<>
										<Button
											id="basic-button"
											aria-controls={
												open
													? "basic-menu"
													: undefined
											}
											aria-haspopup="true"
											aria-expanded={
												open
													? "true"
													: undefined
											}
											startIcon={
												<MdiFilterOutline />
											}
											endIcon={
												<MdiChevronDown />
											}
											onClick={openFiltersMenu}
											color="white"
											// sx={{ p: 1 }}
											// size="small"
										>
											Filter
										</Button>
										<Menu
											id="basic-menu"
											anchorEl={
												filterButtonAnchorEl
											}
											open={filterMenuOpen}
											onClose={
												closeFiltersMenu
											}
											MenuListProps={{
												"aria-labelledby":
													"basic-button",
												sx: { p: 1 },
											}}
											anchorOrigin={{
												vertical: "bottom",
												horizontal:
													"center",
											}}
											transformOrigin={{
												vertical: "top",
												horizontal:
													"center",
											}}
											sx={{
												maxHeight: "55%",
											}}
										>
											<Accordion>
												<AccordionSummary
													expandIcon={
														<MdiChevronDown />
													}
													aria-controls="panel1bh-content"
													id="panel1bh-header"
												>
													<Typography
														sx={{
															width: "33%",
															flexShrink: 0,
														}}
													>
														Status
													</Typography>
												</AccordionSummary>
												<Divider />
												<AccordionDetails
													sx={{
														maxHeight:
															"15em",
														overflow:
															"auto",
													}}
												>
													<Stack>
														{availableWatchStatus.map(
															(
																item,
																index,
															) => {
																return (
																	<MenuItem
																		sx={{
																			justifyContent:
																				"space-between",
																		}}
																		key={
																			index
																		}
																	>
																		{
																			item.title
																		}
																		<Checkbox
																			value={
																				item.value
																			}
																			onChange={(
																				e,
																			) =>
																				item.state(
																					e
																						.target
																						.checked,
																				)
																			}
																		/>
																	</MenuItem>
																);
															},
														)}
													</Stack>
												</AccordionDetails>
											</Accordion>
											{!onlyStatusFilterViews.includes(
												currentLib.data
													.Items[0]
													.CollectionType,
											) && (
												<Accordion>
													<AccordionSummary
														expandIcon={
															<MdiChevronDown />
														}
														aria-controls="panel1bh-content"
														id="panel1bh-header"
													>
														<Typography
															sx={{
																width: "33%",
																flexShrink: 0,
															}}
														>
															Features
														</Typography>
													</AccordionSummary>
													<Divider />
													<AccordionDetails
														sx={{
															maxHeight:
																"15em",
															overflow:
																"auto",
														}}
													>
														<Stack>
															{availableFeatureFilters.map(
																(
																	item,
																	index,
																) => {
																	return (
																		<MenuItem
																			sx={{
																				justifyContent:
																					"space-between",
																			}}
																			key={
																				index
																			}
																		>
																			{
																				item.title
																			}
																			<Checkbox
																				value={
																					item.value
																				}
																				onChange={(
																					e,
																				) =>
																					item.state(
																						e
																							.target
																							.checked,
																					)
																				}
																			/>
																		</MenuItem>
																	);
																},
															)}
														</Stack>
													</AccordionDetails>
												</Accordion>
											)}
											{!onlyStatusFilterViews.includes(
												currentLib.data
													.Items[0]
													.CollectionType,
											) && (
												<Accordion>
													<AccordionSummary
														expandIcon={
															<MdiChevronDown />
														}
														aria-controls="panel1bh-content"
														id="panel1bh-header"
													>
														<Typography
															sx={{
																flexShrink: 0,
															}}
															noWrap
														>
															Video
															Type
														</Typography>
													</AccordionSummary>
													<Divider />
													<AccordionDetails
														sx={{
															maxHeight:
																"15em",
															overflow:
																"auto",
														}}
													>
														<Stack>
															{availableVideoTypeFilters.map(
																(
																	item,
																	index,
																) => {
																	return (
																		<MenuItem
																			sx={{
																				justifyContent:
																					"space-between",
																			}}
																			key={
																				index
																			}
																		>
																			{
																				item.title
																			}
																			<Checkbox
																				value={
																					item.value
																				}
																				onChange={(
																					e,
																				) =>
																					item.state(
																						e
																							.target
																							.checked,
																					)
																				}
																			/>
																		</MenuItem>
																	);
																},
															)}
														</Stack>
													</AccordionDetails>
												</Accordion>
											)}
										</Menu>
									</>
								)}
							{!disabledSortViews.includes(
								currentViewType,
							) && (
								<>
									{sortByData != undefined &&
										sortBy != undefined && (
											<>
												<Checkbox
													icon={
														<MdiSortDescending />
													}
													checkedIcon={
														<MdiSortAscending />
													}
													sx={{
														color: "white !important",
													}}
													color="white"
													onChange={
														handleSortChange
													}
													checked={
														sortAscending
													}
												/>
												<TextField
													select
													hiddenLabel
													value={sortBy}
													size="small"
													variant="filled"
													onChange={
														handleSortBy
													}
												>
													{sortByData.map(
														(
															item,
															index,
														) => {
															return (
																<MenuItem
																	key={
																		index
																	}
																	value={
																		item.value
																	}
																>
																	{`By ${item.title}`}
																</MenuItem>
															);
														},
													)}
												</TextField>
											</>
										)}
								</>
							)}
							{viewType.length != 0 &&
								currentViewType != undefined && (
									<TextField
										select
										hiddenLabel
										// value={viewType[0].value}
										value={currentViewType}
										size="small"
										variant="filled"
										onChange={
											handleCurrentViewType
										}
									>
										{viewType.map(
											(item, index) => {
												return (
													<MenuItem
														key={
															item.value
														}
														value={
															item.value
														}
													>
														{
															item.title
														}
													</MenuItem>
												);
											},
										)}
									</TextField>
								)}
						</Stack>
					</Toolbar>
				</AppBar>
				{items.isLoading || items.isFetching ? (
					<Box
						sx={{
							position: "absolute",
							top: 0,
							left: 0,
							height: "100%",
							width: "100%",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<CircularProgress
							variant="indeterminate"
							sx={{
								position: "absolute",
								top: "50%",
								left: "50%",
								transform: "translate(-50%,50%)",
								width: "50%",
							}}
						/>
					</Box>
				) : items.data.TotalRecordCount == 0 ? (
					<EmptyNotice />
				) : currentViewType != BaseItemKind.Audio ? (
					<Grid2 container columns={{ xs: 2, sm: 4, md: 8 }}>
						{items.data.Items.map((item, index) => {
							return (
								<Grid2
									key={item.Id}
									xs={1}
									sm={1}
									md={1}
									component={motion.div}
									initial={{
										scale: 0.8,
										opacity: 0,
									}}
									animate={{
										scale: 1,
										opacity: 1,
									}}
									transition={{
										duration: 0.25,
										ease: "easeInOut",
										delay: 0.02 * index,
									}}
								>
									<Card
										itemName={item.Name}
										itemId={item.Id}
										imageTags={
											!!item.ImageTags.Primary
										}
										subText={
											item.Type.includes(
												"Music",
											)
												? item.AlbumArtist
												: item.ProductionYear
										}
										iconType={item.Type}
										playedPercent={
											!!item.UserData
												? item.UserData
														.PlayedPercentage
												: 0
										}
										cardOrientation={
											item.Type ==
												"MusicArtist" ||
											item.Type ==
												"MusicAlbum" ||
											item.Type ==
												"MusicGenre" ||
											item.Type == "Playlist"
												? "square"
												: "portait"
										}
										watchedStatus={
											!!item.UserData
												? item.UserData
														.Played
												: false
										}
										watchedCount={
											item.UserData
												?.UnplayedItemCount
										}
										blurhash={
											item.ImageBlurHashes ==
											{}
												? ""
												: !!item.ImageTags
														.Primary
												? !!item
														.ImageBlurHashes
														.Primary
													? item
															.ImageBlurHashes
															.Primary[
															item
																.ImageTags
																.Primary
													  ]
													: ""
												: ""
										}
										currentUser={user.data}
										favourite={
											item.UserData?.IsFavorite
										}
									></Card>
								</Grid2>
							);
						})}
					</Grid2>
				) : (
					<TableContainer>
						<Table>
							<TableBody>
								{items.data.Items.map((item, index) => {
									return (
										<TableRow
											component={motion.div}
											key={item.Id}
											sx={{
												"& td,& th": {
													borderBottom:
														"1px solid rgb(255 255 255 / 0.1)",
												},
												"&:last-child td, &:last-child th":
													{ border: 0 },
												"&:hover": {
													background:
														"rgb(255 255 255 / 0.05)",
												},
											}}
											initial={{
												scale: 0.8,
												opacity: 0,
											}}
											animate={{
												scale: 1,
												opacity: 1,
											}}
											transition={{
												duration: 0.25,
												ease: "easeInOut",
												delay: 0.02 * index,
											}}
										>
											<TableCell width="4.5em">
												<Box className="library-list-image-container">
													{!!item
														.ImageTags
														.Primary && (
														<img
															className="library-list-image"
															src={`${window.api.basePath}/Items/${item.Id}/Images/Primary?quality=80&tag=${item.ImageTags.Primary}`}
														/>
													)}
													<Box className="library-list-icon-container">
														<MdiMusic className="library-list-icon" />
													</Box>
												</Box>
											</TableCell>
											<TableCell>
												<Typography variant="h6">
													{item.Name}
												</Typography>
												<Stack
													direction="row"
													divider={
														<Typography
															variant="subtitle1"
															sx={{
																opacity: 0.7,
															}}
														>
															,
														</Typography>
													}
												>
													{item.Artists.map(
														(
															artist,
															aindex,
														) => {
															return (
																<Typography
																	variant="subtitle1"
																	sx={{
																		opacity: 0.7,
																	}}
																	key={
																		aindex
																	}
																>
																	{
																		artist
																	}
																</Typography>
															);
														},
													)}
												</Stack>
											</TableCell>
											<TableCell>
												<Typography variant="subtitle1">
													{getRuntimeMusic(
														item.RunTimeTicks,
													)}
												</Typography>
											</TableCell>
											<TableCell width="1em">
												<IconButton
													onClick={() => {
														handleLiking(
															item,
														);
													}}
												>
													{item.UserData
														.IsFavorite ? (
														<MdiHeart />
													) : (
														<MdiHeartOutline />
													)}
												</IconButton>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}

				{!items.isFetching &&
					!disablePaginationViews.includes(currentViewType) &&
					items.isSuccess &&
					items.data.TotalRecordCount > maxDisplayItems && (
						<Stack
							alignItems="center"
							justifyContent="center"
							paddingTop={2}
							direction="row"
						>
							<Typography
								variant="subtitle2"
								sx={{ opacity: 0.5 }}
							>
								{maxDisplayItems * (page - 1)} -{" "}
								{items.data.TotalRecordCount <=
								maxDisplayItems * page
									? items.data.TotalRecordCount
									: maxDisplayItems * page}{" "}
								of {items.data.TotalRecordCount}
							</Typography>
							<Pagination
								page={page}
								onChange={(e, val) => {
									setPage(val);
								}}
								count={Math.ceil(
									items.data.TotalRecordCount /
										maxDisplayItems,
								)}
								sx={{
									width: "fit-content",
								}}
							/>
						</Stack>
					)}

				{items.isError && <ErrorNotice />}
			</Box>
		</Box>
	);
};

export default LibraryView;
