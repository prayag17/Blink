/** @format */
import { useState, useEffect } from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import { Blurhash } from "react-blurhash";
import { showAppBar, showBackButton } from "../../utils/slice/appBar";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";

import { useQuery } from "@tanstack/react-query";
import { MdiStarHalfFull } from "../../components/icons/mdiStarHalfFull";
import { getRuntimeFull } from "../../utils/date/time";
import { TypeIconCollectionCard } from "../../components/utils/iconsCollection";

import { Card } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";

import "./item.module.scss";

const ItemDetail = () => {
	const { id } = useParams();
	const dispatch = useDispatch();
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
	});

	const seasons = useQuery({
		queryKey: ["item", "seasons", id],
		queryFn: async () => {
			const result = await getTvShowsApi(window.api).getSeasons({
				seriesId: item.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess,
	});

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
							resolutionX={64}
							resolutionY={96}
							style={{
								aspectRatio: "0.666",
							}}
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
					<Box className="item-detail-header" mb={5}>
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
							className="item-detail-image-container"
							sx={
								item.data.Type.includes("Music") && {
									aspectRatio: "1",
								}
							}
						>
							{!!item.data.ImageTags.Primary && (
								<img
									src={
										window.api.basePath +
										"/Items/" +
										item.data.Id +
										"/Images/Primary"
									}
									style={{
										opacity: primageImageLoaded
											? 1
											: 0,
									}}
									className="item-detail-image"
									onLoad={() =>
										setPrimaryImageLoaded(true)
									}
								/>
							)}
							{!!item.data.ImageBlurHashes.Primary && (
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
								{TypeIconCollectionCard[item.data.Type]}
							</div>
						</Box>
						<Box className="item-detail-info-container">
							<Box
								className="item-detail-title-name"
								sx={{ mb: 2 }}
							>
								<Typography variant="h3">
									{item.data.Name}
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
								ex={{ alignItems: "center" }}
							>
								{item.data.ProductionYear && (
									<Typography
										sx={{ flexGrow: 0 }}
										variant="subtitle1"
									>
										{item.data.ProductionYear}
									</Typography>
								)}
								<Chip
									variant="outlined"
									label={
										!!item.data.OfficialRating
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
									{!!item.data.CommunityRating ? (
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
											item.data.RunTimeTicks,
										)}
									</Typography>
								)}
							</Stack>
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
					<Typography variant="body1" mt={3} mb={5}>
						{item.data.Overview}
					</Typography>
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
					{seasons.isSuccess && (
						<Box>
							<Tabs value={0}>
								{seasons.data.Items.map(
									(season, index) => {
										return (
											<Tab
												label={season.Name}
											/>
										);
									},
								)}
							</Tabs>
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
		return <h1>{"Something went wrong :("}</h1>;
	}
};

export default ItemDetail;
