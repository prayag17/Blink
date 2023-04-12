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

import { Blurhash } from "react-blurhash";
import { showAppBar, showBackButton } from "../../utils/slice/appBar";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";

import { useQuery } from "@tanstack/react-query";
import { MdiStarHalfFull } from "../../components/icons/mdiStarHalfFull";
import { getRuntimeFull } from "../../utils/date/time";
import { TypeIconCollectionCard } from "../../components/utils/iconsCollection";

import { Card } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";

import "./item.module.scss";

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`full-width-tabpanel-${index}`}
			aria-labelledby={`full-width-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3 }}>
					<Typography>{children}</Typography>
				</Box>
			)}
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
	});

	const [currentSeason, setCurrentSeason] = useState(0);
	const episodes = useQuery({
		queryKey: ["item", "episode", `season ${currentSeason + 1}`],
		queryFn: async () => {
			const result = await getTvShowsApi(window.api).getEpisodes({
				seriesId: item.data.Id,
				seasonId: seasons.data.Items[currentSeason].Id,
			});
			return result.data;
		},
		enabled: seasons.isSuccess,
		networkMode: "always",
	});

	const personShows = useQuery({
		queryKey: ["item", "personShows"],
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
		enabled: item.isSuccess && item.data.Type == "Person",
		networkMode: "always",
	});
	const personMovies = useQuery({
		queryKey: ["item", "personMovies"],
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
		enabled: item.isSuccess && item.data.Type == "Person",
		networkMode: "always",
	});
	const personBooks = useQuery({
		queryKey: ["item", "personBooks"],
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
		enabled: item.isSuccess && item.data.Type == "Person",
		networkMode: "always",
	});
	const personPhotos = useQuery({
		queryKey: ["item", "personPhotos"],
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
		enabled: item.isSuccess && item.data.Type == "Person",
		networkMode: "always",
	});
	const personDataEmpty = (pitem) => {
		let result;
		switch (pitem) {
			case "Movies":
				result = personMovies.data.Items.length == 0;
				break;
			case "TV Shows":
				result = personShows.data.Items.length == 0;
				break;
			case "Books":
				result = personBooks.data.Items.length == 0;
				break;
			case "Photos":
				result = personPhotos.data.Items.length == 0;
				break;
			default:
				result = true;
				break;
		}
		console.log("Result => ", result);
		return result;
	};

	const [activePersonTab, setActivePersonTab] = useState(0);
	const personTabs = ["Movies", "TV Shows", "Books", "Photos"];

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
	} else if (item.isSuccess && similarItems.isSuccess) {
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
							resolutionX={64}
							resolutionY={96}
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
						gap: 1,
					}}
				>
					<Box className="item-detail-header" mb={0}>
						<Box className="item-detail-header-backdrop">
							{item.data.BackdropImageTags.length != 0 && (
								<img
									src={
										window.api.basePath +
										"/Items/" +
										item.data.Id +
										"/Images/Backdrop"
									}
									style={{
										opacity: backdropImageLoaded
											? 1
											: 0,
									}}
									className="item-detail-image"
									onLoad={() =>
										setBackdropImageLoaded(true)
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
									resolutionX={64}
									resolutionY={96}
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
								{!!item.data.ImageTags.Primary && (
									<img
										src={
											window.api.basePath +
											"/Items/" +
											item.data.Id +
											"/Images/Primary?quality=10"
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
										resolutionX={64}
										resolutionY={96}
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
										sx={{ width: "30%" }}
										textOverflow="ellipsis"
										whiteSpace="nowrap"
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
									{!!item.data.UserData
										.PlayedPercentage && (
										<LinearProgress
											variant="determinate"
											value={
												item.data.UserData
													.PlayedPercentage
											}
											sx={{
												borderRadius: 1000,
												width: "75%",
												mt: 1,
												mb: 1,
											}}
											color="primary"
										/>
									)}
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
						<Box className="item-media-container">
							<Stack
								direction="row"
								gap={1}
								alignItems="center"
							>
								<Typography variant="h5">
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
					{seasons.isSuccess && (
						<Box>
							<Tabs
								variant="scrollable"
								scrollButtons="auto"
								value={currentSeason}
								onChange={(e, newVal) => {
									setCurrentSeason(newVal);
								}}
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
										Item {index}
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

					{item.data.Type == "Person" &&
						personShows.isSuccess &&
						personMovies.isSuccess &&
						personBooks.isSuccess &&
						personPhotos.isSuccess && (
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
										</TabPanel>
									);
								})}
							</Box>
						)}

					{similarItems.data.Items.length != 0 && (
						<CardScroller
							headingProps={{
								variant: "h5",
								fontSize: "1.8em",
							}}
							displayCards={8}
							title={`More Like This`}
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
	} else if (item.isError || similarItems.isError) {
		return <h1>{"Something went wrong :("}</h1>;
	}
};

export default ItemDetail;
