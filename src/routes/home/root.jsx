/** @format */

import { useState, useEffect } from "react";

import { useQueryClient, useQuery } from "@tanstack/react-query";

import { EventEmitter as event } from "../../eventEmitter";
import { getServer } from "../../utils/storage/servers";
import { getUser } from "../../utils/storage/user";

import { theme } from "../../theme";
import "./home.module.scss";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

import { yellow } from "@mui/material/colors";

import Carousel from "react-material-ui-carousel";

// Custom Components
import { CardLandscape, CardPotrait } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";
// Icons
import { MediaTypeIconCollection } from "../../components/utils/iconsCollection.jsx";
import { MdiStarHalfFull } from "../../components/icons/mdiStarHalfFull";
import { MdiPlayOutline } from "../../components/icons/mdiPlayOutline";
import { MdiChevronRight } from "../../components/icons/mdiChevronRight";

import { useDispatch, useSelector } from "react-redux";
import { showSidemenu } from "../../utils/slice/sidemenu";

import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { useNavigate } from "react-router-dom";

import { formateDate } from "../../utils/date/formateDate";
import { getRuntime } from "../../utils/date/time";

export const Home = () => {
	const queryClient = useQueryClient();

	const authUser = useQuery({
		queryKey: ["home", "authenticateUser"],
		queryFn: async () => {
			const server = await getServer();
			const user = await getUser();
			event.emit("create-jellyfin-api", server.Ip);
			const auth = await api.authenticateUserByName(
				user.Name,
				user.Password,
			);
			sessionStorage.setItem("accessToken", auth.data.AccessToken);
			event.emit("set-api-accessToken", window.api.basePath);
			return true;
		},
		enabled: !window.api,
	});

	const libraries = useQuery({
		queryKey: ["home", "libraries"],
		queryFn: async () => {
			let libs = await getLibraryApi(window.api).getMediaFolders();
			dispatch(showSidemenu());
			return libs.data;
		},
	});

	const user = useQuery({
		queryKey: ["home", "user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		enabled: !!authUser,
	});

	const latestMedia = useQuery({
		queryKey: ["home", "latestMedia"],
		queryFn: async () => {
			const media = await getUserLibraryApi(window.api).getLatestMedia(
				{
					userId: user.data.Id,
					fields: "Overview",
					enableUserData: true,
				},
			);
			return media.data;
		},
		enabled: !!user.data,
	});

	const [userLibraries, setUserLibraries] = useState([]);
	const [latestMovies, setLatestMovies] = useState([]);
	const [Auser, setUser] = useState({
		Name: "",
	});

	const dispatch = useDispatch();
	const dataT = useSelector((state) => {
		state.sidebar.data;
	});

	const navigate = useNavigate();
	const excludeTypes = ["boxsets", "playlists", "livetv", "channels"];

	const handleLogout = async () => {
		await window.api.logout();
		navigate("/login");
		console.log("logged out user");
	};

	return (
		<>
			<Box
				sx={{
					display: "flex",
				}}
			>
				{/* <MuiDrawer
					anchor="left"
					open={drawerState}
					onClose={handleDrawerClose}
				>
					<DrawerHeader
						className="Mui-DrawerHeader"
						sx={{ position: "relative", height: "20vh" }}
					>
						<div>
						<Avatar src={""}/>
						<Typography variant="h3">
						{user["Name"]}
						</Typography>
					</div>
						<IconButton
							onClick={handleDrawerClose}
							sx={{
								position: "absolute",
								top: "10%",
								right: "5%",
							}}
						>
							<Close />
						</IconButton>
					</DrawerHeader>
					<Divider />
					<List sx={{ border: "none" }}>
						{userLibraries.map((library, index) => {
							return (
								<ListItem disablePadding key={index}>
									<ListItemButton
										sx={{
											minHeight: 48,
											justifyContent:
												drawerState
													? "initial"
													: "center",
											px: 2.5,
										}}
									>
										<ListItemIcon
											sx={{
												minWidth: 0,
												mr: 3,
												justifyContent:
													"center",
											}}
										>
											{
												MediaCollectionTypeIconCollection[
													library
														.CollectionType
												]
											}
										</ListItemIcon>
										<ListItemText
											primary={library.Name}
										/>
									</ListItemButton>
								</ListItem>
							);
						})}
					</List>
				</MuiDrawer> */}
				<Box
					component="main"
					className="scrollY"
					sx={{ flexGrow: 1, p: 3 }}
				>
					<Carousel
						className="hero-carousel"
						autoPlay={true}
						animation="fade"
						height="70vh"
						IndicatorIcon={
							<div className="hero-carousel-indicator"></div>
						}
						activeIndicatorIconButtonProps={{
							style: {
								background: "rgb(255 255 255)",
							},
						}}
						indicatorIconButtonProps={{
							style: {
								background: "rgb(255 255 255 / 0.3)",
								borderRadius: "2px",
								width: "100%",
								flexShrink: "1",
							},
						}}
						indicatorContainerProps={{
							style: {
								display: "flex",
								gap: "1em",
							},
						}}
						sx={{
							marginBottom: "1.5em",
						}}
						interval={10000}
					>
						{latestMedia.isLoading ? (
							<Paper
								className="hero-carousel-slide"
								sx={{
									background:
										theme.palette.primary
											.background.dark,
								}}
							>
								<div className="hero-carousel-background">
									<Skeleton
										variant="rectangular"
										height="100%"
										animation="wave"
									></Skeleton>
								</div>
								<Box className="hero-carousel-detail">
									<Typography
										variant="h3"
										className="hero-carousel-text"
									>
										<Skeleton
											variant="text"
											sx={{ fontSize: "5rem" }}
											width={300}
											animation="wave"
										></Skeleton>
									</Typography>
									<Typography
										variant="p"
										className="hero-carousel-text"
									>
										<Skeleton
											variant="text"
											sx={{ fontSize: "3rem" }}
											width={400}
											animation="wave"
										></Skeleton>
									</Typography>
								</Box>
							</Paper>
						) : (
							// <></>
							latestMedia.data != null &&
							latestMedia.data.map((item, index) => {
								// console.log(item);
								return (
									<Paper
										className="hero-carousel-slide"
										sx={{
											background:
												theme.palette
													.primary
													.background
													.dark,
										}}
										key={index}
									>
										<div className="hero-carousel-background-container">
											{item.ImageBlurHashes
												.Backdrop ? (
												<div
													className="hero-carousel-background-image"
													style={{
														backgroundImage: `url(${
															window
																.api
																.basePath +
															"/Items/" +
															item.Id +
															"/Images/Backdrop"
														})`,
													}}
												></div>
											) : (
												<div className="hero-carousel-background-image empty"></div>
											)}
											<div className="hero-carousel-background-icon-container">
												{
													MediaTypeIconCollection[
														item
															.MediaType
													]
												}
											</div>
										</div>
										<Box className="hero-carousel-detail">
											<Typography
												variant="h3"
												className="hero-carousel-text"
												sx={{ mb: 2.5 }}
											>
												{!item.ImageTags
													.Logo ? (
													item.Name
												) : (
													<img
														className="hero-carousel-text-logo"
														src={
															window
																.api
																.basePath +
															"/Items/" +
															item.Id +
															"/Images/Logo?quality=80&tag=" +
															item
																.ImageTags
																.Logo
														}
													></img>
												)}
											</Typography>
											<Box
												sx={{
													display: "flex",
													alignItems:
														"center",
													width: "fit-content",
													gap: "1em",
													mb: 1.5,
												}}
												className="hero-carousel-info"
											>
												<Typography
													variant="subtitle1"
													// color="GrayText"
												>
													{formateDate(
														item.PremiereDate,
													)}
												</Typography>
												<Divider
													variant="middle"
													component="div"
													orientation="vertical"
													flexItem
												/>
												<Chip
													variant="outlined"
													label={
														item.OfficialRating
													}
												/>
												<Divider
													variant="middle"
													component="div"
													orientation="vertical"
													flexItem
												/>
												<Box
													sx={{
														display: "flex",
														gap: "0.25em",
														alignItems:
															"center",
													}}
													className="hero-carousel-info-rating"
												>
													<MdiStarHalfFull
														colorA={
															yellow[700]
														}
													/>
													<Typography variant="subtitle1">
														{Math.round(
															item.CommunityRating *
																10,
														) / 10}
													</Typography>
												</Box>
												<Divider
													variant="middle"
													component="div"
													orientation="vertical"
													flexItem
												/>
												<Typography variant="subtitle1">
													{getRuntime(
														item.RunTimeTicks,
													)}
												</Typography>
											</Box>
											<Typography
												variant="subtitle1"
												className="hero-carousel-text"
												sx={{
													display: "-webkit-box",
													maxWidth:
														"70%",
													maxHeight:
														"30%",
													textOverflow:
														"ellipsis",
													overflow:
														"hidden",
													WebkitLineClamp:
														"3",
													WebkitBoxOrient:
														"vertical",
													opacity: 0.7,
												}}
											>
												{item.Overview}
											</Typography>
											{/* TODO Link PLay and More info buttons in carousel */}
											<Box
												sx={{
													display: "flex",
													gap: 3,
													mt: 3,
												}}
												className="hero-carousel-button-container"
											>
												<Button
													variant="contained"
													endIcon={
														<MdiPlayOutline />
													}
													disabled
												>
													Play
												</Button>
												<Button
													color="white"
													variant="outlined"
													endIcon={
														<MdiChevronRight />
													}
													disabled
												>
													More info
												</Button>
											</Box>
										</Box>
									</Paper>
								);
							})
						)}
					</Carousel>

					<Box className="home-section">
						<Typography
							variant="h4"
							color="textPrimary"
							className="home-section-heading"
						>
							<div className="home-section-heading-decoration"></div>{" "}
							Libraries
						</Typography>
						<CardScroller displayCards={4}>
							{userLibraries.map((library, index) => {
								// console.log(userLibraries);
								return (
									<CardLandscape
										key={index}
										itemName={library.Name}
										itemId={library.Id}
										imageTags={library.imageTags}
										iconType={
											library.CollectionType
										}
									></CardLandscape>
								);
							})}
						</CardScroller>
					</Box>

					<Box className="home-section">
						<Typography
							variant="h4"
							color="textPrimary"
							className="home-section-heading"
						>
							<div className="home-section-heading-decoration"></div>{" "}
							Latest Movies
						</Typography>
						<CardScroller displayCards={7}>
							{latestMovies.map((movie, index) => {
								return (
									<CardPotrait
										key={index}
										itemName={movie.Name}
										itemId={movie.Id}
										imageTags={movie.imageTags}
										iconType={movie.MediaType}
									></CardPotrait>
								);
							})}
						</CardScroller>
					</Box>

					<Button variant="contained" onClick={handleLogout}>
						Logout
					</Button>
				</Box>
			</Box>
		</>
	);
};
