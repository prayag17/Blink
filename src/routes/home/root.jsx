/** @format */

import { useState, useEffect } from "react";

import { Blurhash, BlurhashCanvas } from "react-blurhash";

import { useQueryClient, useQuery } from "@tanstack/react-query";

import { EventEmitter as event } from "../../eventEmitter";
import { getServer } from "../../utils/storage/servers";
import { getUser, delUser } from "../../utils/storage/user";

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
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";

import { useNavigate } from "react-router-dom";

import { formateDate } from "../../utils/date/formateDate";
import { getRuntime } from "../../utils/date/time";
import { CarouselSkeleton } from "../../components/skeleton/carousel";

const Home = () => {
	const queryClient = useQueryClient();

	const authUser = useQuery({
		queryKey: ["home", "authenticateUser"],
		queryFn: async () => {
			const server = await getServer();
			const user = await getUser();
			event.emit("create-jellyfin-api", server.Ip);
			const auth = await window.api.authenticateUserByName(
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

	const resumeItemsVideo = useQuery({
		queryKey: ["home", "resume", "video"],
		queryFn: async () => {
			const resumeItems = await getItemsApi(window.api).getResumeItems(
				{
					userId: user.data.Id,
					limit: 16,
					mediaTypes: ["Video"],
				},
			);
			return resumeItems.data;
		},
		enabled: !!user.data,
	});

	const resumeItemsAudio = useQuery({
		queryKey: ["home", "resume", "audio"],
		queryFn: async () => {
			const resumeItems = await getItemsApi(window.api).getResumeItems(
				{
					userId: user.data.Id,
					limit: 16,
					mediaTypes: ["Audio"],
				},
			);
			return resumeItems.data;
		},
		enabled: !!user.data,
	});

	const upNextItems = useQuery({
		queryKey: ["home", "upNext"],
		queryFn: async () => {
			const upNext = await getTvShowsApi(window.api).getNextUp({
				userId: user.data.Id,
				limit: 16,
			});
			return upNext.data;
		},
		enabled: !!user.data,
	});

	const fetchLatestMedia = async (lib) => {
		const latmedia = useQuery({
			queryKey: ["home", "latestMedia", lib.name],
			queryFn: async () => {
				const media = await getUserLibraryApi(
					window.api,
				).getLatestMedia({
					userId: user.data.Id,
					parentId: lib.parentId,
					limit: 16,
				});
				return media.data;
			},
		});
		return latmedia;
	};

	const [latestMediaContent, setLatestMediaContent] = useState([]);
	const [latestMediaLib, setLatestMediaLib] = useState("");

	// const latestMediaData = useQueries(latestMediaContent);

	const dispatch = useDispatch();
	const dataT = useSelector((state) => {
		state.sidebar.data;
	});

	const navigate = useNavigate();

	const [layoutState, setLayoutState] = useState(null);

	const layout = [
		{
			type: "libs",
			name: "Libraries",
			data: libraries.data,
			// isLoading: libraries.isLoading,
			isLoading: false,
		},
		{
			type: "resumeVideo",
			name: "Continue Watching",
			data: resumeItemsVideo.data,
			// isLoading: resumeItemsVideo.isLoading,
			isLoading: false,
		},
		{
			type: "resumeAudio",
			name: "Continue Listnening",
			data: resumeItemsAudio.data,
			// isLoading: resumeItemsAudio.isLoading,
			isLoading: false,
		},
		{
			type: "nextup",
			name: "Next Up",
			data: upNextItems.data,
			// isLoading: upNextItems.isLoading,
			isLoading: false,
		},
	];

	const latestMediaLayout = [];

	const excludeTypes = ["boxsets", "playlists", "livetv", "channels"];

	const getLatestMedia = async () => {
		libraries.data.Items.map(async (lib) => {
			// console.log(lib);
			if (excludeTypes.includes(lib.CollectionType)) {
				return;
			} else {
				latestMediaLayout.push({
					type: "latestMedia",
					name: `Latest ${lib.Name}`,
					parentId: lib.Id,
					isLoading: false,
				});
				setLatestMediaContent(latestMediaLayout);
			}
		});
	};

	const handleLogout = async () => {
		console.log("Logging out user...");
		await window.api.logout();
		delUser();
		navigate("/login");
	};

	useEffect(() => {
		if (libraries.isSuccess) {
			getLatestMedia();
			console.log(latestMediaContent);
			for (let lib of latestMediaContent) {
				console.log(lib);
				fetchLatestMedia(lib);
			}
		}
	}, []);

	return (
		<>
			<Box
				sx={{
					display: "flex",
				}}
			>
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
							<CarouselSkeleton />
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
												<>
													<Blurhash
														hash={
															item
																.ImageBlurHashes
																.Backdrop[
																item
																	.BackdropImageTags[0]
															]
														}
														// hash="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
														width="1080"
														height="720"
														resolutionX={
															512
														}
														resolutionY={
															512
														}
														className="hero-carousel-background-blurhash"
													/>
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
												</>
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
												sx={{
													mb: 2.5,
												}}
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
					<CardScroller displayCards={4} title={"Libraries"}>
						{libraries.isLoading ? (
							<>"loading...</>
						) : (
							libraries.data.Items.map((item, index) => {
								return (
									<CardLandscape
										key={index}
										itemName={item.Name}
										itemId={item.Id}
										// imageTags={false}
										imageTags={
											!!item.ImageTags.Primary
										}
										iconType={item.CollectionType}
									></CardLandscape>
								);
							})
						)}
					</CardScroller>

					{/* <Box className="home-section">
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
					</Box> */}
					<Button variant="contained" onClick={handleLogout}>
						Logout
					</Button>
				</Box>
			</Box>
		</>
	);
};

/* <MuiDrawer
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
				</MuiDrawer> */

export default Home;
