/** @format */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAppBar, showBackButton } from "../../utils/slice/appBar";
import { useParams, useNavigate } from "react-router-dom";

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

import { theme } from "../../theme";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
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

const LibraryView = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const appBarVisiblity = useSelector((state) => state.appBar.visible);

	if (!appBarVisiblity) {
		dispatch(showAppBar());
	}
	const { id } = useParams();

	const user = useQuery({
		queryKey: ["libraryView", "user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
	});

	const [sortAscending, setSortAscending] = useState(false);
	const [sortBy, setSortBy] = useState("SortName");
	const [sortByData, setSortByData] = useState([
		{ title: "Name", value: "SortName" },
		{ title: "Rating", value: "CommunityRating" },
		{ title: "Release Date", value: "PremiereDate" },
	]);
	const handleSortChange = (e) => {
		setSortAscending(e.target.checked);
	};
	const handleSortBy = (e) => {
		setSortBy(e.target.value);
	};

	const fetchLib = async (libraryId) => {
		const result = await getItemsApi(window.api).getItems({
			userId: user.data.Id,
			ids: [libraryId],
		});
		return result.data;
	};
	const currentLib = useQuery({
		queryKey: ["libraryView", "currentLib", id],
		queryFn: () => fetchLib(id),
		enabled: !!user.data,
	});

	if (currentLib.isSuccess) {
		dispatch(showBackButton());
	}

	const [isPlayed, setIsPlayed] = useState(false);
	const [isUnPlayed, setIsUnPlayed] = useState(false);
	const [isResumable, setIsResumable] = useState(false);
	const [isFavourite, setIsFavourite] = useState(false);
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
			state: (val) => setIsFavourite(val),
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
					{ title: "Movies", value: "Movie" },
					{ title: "Collections", value: "BoxSet" },
					{ title: "Actors", value: "Person" },
					{ title: "Genres", value: "Genre" },
					{ title: "Studios", value: "Studio" },
				]);
			} else if (currentLib.data.Items[0].CollectionType == "music") {
				setViewType([
					{ title: "Albums", value: "MusicAlbum" },
					{ title: "Artists", value: "MusicArtist" },
					{ title: "Genres", value: "MusicGenre" },
				]);
			} else if (
				currentLib.data.Items[0].CollectionType == "tvshows"
			) {
				setViewType([
					{ title: "Series", value: "Series" },
					{ title: "Actors", value: "Person" },
					{ title: "Genres", value: "Genre" },
					{ title: "Networks", value: "Studio" },
				]);
			} else {
				setViewType([]);
			}
		}
	}, [currentLib.isSuccess]);

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
				sortOrder: [sortAscending ? "Ascending" : "Descending"],
				sortBy: sortBy,
				filters: [
					isPlayed && "IsPlayed",
					isUnPlayed && "IsUnplayed",
					isResumable && "IsResumable",
					isFavourite && "IsFavorite",
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
			});
		}
		return result.data;
	};

	const items = useQuery({
		queryKey: [
			"libraryView",
			"currentLibItems",
			id,
			[
				currentViewType,
				sortAscending,
				sortBy,
				[
					isPlayed,
					isUnPlayed,
					isResumable,
					isFavourite,
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
	});

	const handleCurrentViewType = (e) => {
		setCurrentViewType(e.target.value);
	};

	useEffect(() => {
		if (viewType.length != 0) setCurrentViewType(viewType[0].value);
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
						width: `calc(100vw - ${theme.spacing(7)})`,
						mt: 8,
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
									<Checkbox
										icon={<MdiSortDescending />}
										checkedIcon={
											<MdiSortAscending />
										}
										color="white"
										onChange={handleSortChange}
										defaultValue={sortAscending}
										sx={{
											color: "white !important",
										}}
									/>
									<TextField
										select
										hiddenLabel
										defaultValue={
											sortByData[0].value
										}
										size="small"
										variant="filled"
										onChange={handleSortBy}
									>
										{sortByData.map(
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
														{`By ${item.title}`}
													</MenuItem>
												);
											},
										)}
									</TextField>
								</>
							)}
							{viewType.length != 0 && (
								<TextField
									select
									hiddenLabel
									defaultValue={viewType[0].value}
									size="small"
									variant="filled"
									onChange={handleCurrentViewType}
								>
									{viewType.map((item, index) => {
										return (
											<MenuItem
												key={item.value}
												value={item.value}
											>
												{item.title}
											</MenuItem>
										);
									})}
								</TextField>
							)}
						</Stack>
					</Toolbar>
				</AppBar>
				{items.isSuccess &&
					(items.data.TotalRecordCount == 0 ? (
						<EmptyNotice />
					) : (
						<Grid2
							container
							columns={{ xs: 2, sm: 4, md: 8 }}
						>
							{items.data.Items.map((item, index) => {
								return (
									<Grid2
										key={index}
										xs={1}
										sm={1}
										md={1}
									>
										<Card
											itemName={item.Name}
											itemId={item.Id}
											imageTags={
												!!item.ImageTags
													.Primary
											}
											subText={
												item.ProductionYear
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
												item.Type ==
													"Playlist"
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
												!!item.UserData &&
												item.UserData
													.UnplayedItemCount
											}
											blurhash={
												item.ImageBlurHashes ==
												{}
													? ""
													: !!item
															.ImageTags
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
										></Card>
									</Grid2>
								);
							})}
						</Grid2>
					))}
				{items.isError && <ErrorNotice />}
			</Box>
		</Box>
	);
};

export default LibraryView;
