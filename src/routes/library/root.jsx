/** @format */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	showAppBar,
	setBackdrop,
	showBackButton,
} from "../../utils/slice/appBar";
import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

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
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";

import { theme } from "../../theme";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getArtistsApi } from "@jellyfin/sdk/lib/utils/api/artists-api";
import { getGenresApi } from "@jellyfin/sdk/lib/utils/api/genres-api";
import { getMusicGenresApi } from "@jellyfin/sdk/lib/utils/api/music-genres-api";
import { getStudiosApi } from "@jellyfin/sdk/lib/utils/api/studios-api";
import { getPersonsApi } from "@jellyfin/sdk/lib/utils/api/persons-api";

import { Card } from "../../components/card/card";
import { EmptyNotice } from "../../components/emptyNotice/emptyNotice";
import { MdiSortDescending } from "../../components/icons/mdiSortDescending";
import { MdiSortAscending } from "../../components/icons/mdiSortAscending";
import { MdiChevronRight } from "../../components/icons/mdiChevronRight";
import { MdiChevronDown } from "../../components/icons/mdiChevronDown";

const LibraryView = () => {
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
		// console.log(currentLib.data.)
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
		console.log(libraryId);
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
				recursive: true,
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
			],
		],
		queryFn: () => fetchLibItems(id),
		enabled: !!user.data,
	});

	dispatch(setBackdrop(true));

	const handleCurrentViewType = (e) => {
		setCurrentViewType(e.target.value);
	};

	useEffect(() => {
		if (viewType.length != 0) setCurrentViewType(viewType[0].value);
	}, [viewType]);

	const allowedSortViews = ["Movie", "Series", "MusicAlbum"];

	const [filterButtonAnchorEl, setFilterButtonAnchorEl] = useState(null);
	const filterMenuOpen = Boolean(filterButtonAnchorEl);
	const openFiltersMenu = (event) => {
		setFilterButtonAnchorEl(event.currentTarget);
	};
	const closeFiltersMenu = () => {
		setFilterButtonAnchorEl(null);
	};

	useEffect(() => {
		console.log(
			isPlayed,
			isUnPlayed,
			isResumable,
			isFavourite,
			isLiked,
			isUnliked,
		);
	}, [isPlayed, isUnPlayed, isResumable, isFavourite, isLiked, isUnliked]);

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
					elevation={0}
					sx={{
						width: `calc(100vw - ${theme.spacing(7)} - 10px)`,
						mt: 8,
					}}
				>
					<Divider />
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
							{allowedSortViews.includes(
								currentViewType,
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
											open ? "true" : undefined
										}
										endIcon={<MdiChevronDown />}
										onClick={openFiltersMenu}
										color="white"
									>
										Filter
									</Button>
									<Menu
										id="basic-menu"
										anchorEl={
											filterButtonAnchorEl
										}
										open={filterMenuOpen}
										onClose={closeFiltersMenu}
										MenuListProps={{
											"aria-labelledby":
												"basic-button",
											sx: { p: 1 },
										}}
										anchorOrigin={{
											vertical: "bottom",
											horizontal: "center",
										}}
										transformOrigin={{
											vertical: "top",
											horizontal: "center",
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
											<AccordionDetails>
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
									</Menu>
								</>
							)}
							{allowedSortViews.includes(
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
							columns={{ xs: 3, sm: 5, md: 8 }}
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
													"MusicGenre"
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
										></Card>
									</Grid2>
								);
							})}
						</Grid2>
					))}
			</Box>
		</Box>
	);
};

export default LibraryView;
