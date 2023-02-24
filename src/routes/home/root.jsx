/** @format */

import { useState, useEffect } from "react";

import { EventEmitter as event } from "../../eventEmitter";
import { getServer } from "../../utils/store/servers";
import { getUser } from "../../utils/store/user";

import { theme } from "../../theme";
import "./home.module.scss";

import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import MuiAppBar from "@mui/material/AppBar";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import Tooltip from "@mui/material/Tooltip";

import Carousel from "react-material-ui-carousel";

// Custom Components
import { CardLandscape, CardPotrait } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";
// Icons
import {
	MediaCollectionTypeIconCollection,
	MediaTypeIconCollection,
} from "../../components/utils/iconsCollection.jsx";
import MenuIcon from "mdi-material-ui/Menu";
import Close from "mdi-material-ui/Close";

import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { useNavigate } from "react-router-dom";

const drawerWidth = 320;

const DrawerHeader = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
	...theme.mixins.toolbar,
}));

const MiniDrawer = styled(MuiDrawer, {
	shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
	flexShrink: 0,
	whiteSpace: "nowrap",
	boxSizing: "border-box",
	backgroundColor: theme.palette.primary.background.dark,
	overflowX: "hidden",
	width: `calc(${theme.spacing(7)} + 10px)`,
}));

const AppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
	zIndex: theme.zIndex.drawer + 1,
	transition: theme.transitions.create(["width", "margin"], {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	backgroundColor: "transparent",
	backgroundImage: "none",
}));

export const Home = () => {
	const [skeletonStateSideMenu, setSkeletonStateSideMenu] = useState(false);
	const [skeletonStateCarousel, setSkeletonStateCarousel] = useState(false);

	const [userLibraries, setUserLibraries] = useState([]);
	const [latestMovies, setLatestMovies] = useState([]);
	const [user, setUser] = useState({
		Name: "",
	});

	const navigate = useNavigate();
	const excludeTypes = ["boxsets", "playlists", "livetv", "channels"];

	const [latestMedia, setLatestMedia] = useState([]);

	const [drawerState, setDrawerState] = useState(false);

	const scrollTrigger = useScrollTrigger({ threshold: 5 });

	const handleDrawerOpen = () => {
		setDrawerState(true);
	};

	const handleDrawerClose = () => {
		setDrawerState(false);
	};

	const handleLogout = async () => {
		await window.api.logout();
		navigate("/login");
		console.log("logged out user");
	};

	const currentUser = async () => {
		const user = await getUserApi(window.api).getCurrentUser();
		return user;
	};

	const userLibs = async () => {
		const userLibs = await getLibraryApi(window.api).getMediaFolders();
		return userLibs;
	};

	const getLatestMedia = async (user) => {
		const media = await getUserLibraryApi(window.api).getLatestMedia({
			userId: user.Id,
			fields: "Overview",
			enableUserData: true,
		});
		return media;
	};

	const userViews = async (user) => {
		const userviews = await getUserViewsApi(window.api).getUserViews({
			userId: user.Id,
		});
		return userviews;
	};

	const authUser = async () => {
		const server = await getServer();
		const user = await getUser();
		event.emit("create-jellyfin-api", server.Ip);
		const auth = await api.authenticateUserByName(
			user.Name,
			user.Password,
		);
		sessionStorage.setItem("accessToken", auth.data.AccessToken);
		event.emit("set-api-accessToken", window.api.basePath);
	};

	useEffect(() => {
		// TODO Implement a better way to check and create api object when page reloaded. Hint: Maybe use session api or something (*route - home*)
		if (!window.api) {
			authUser().then(() => {
				currentUser().then((usr) => {
					setUser(usr.data);
					userLibs().then((libs) => {
						setUserLibraries(libs.data.Items);
						setSkeletonStateSideMenu(true);
					});
					getLatestMedia(usr.data).then((media) => {
						console.log("Using this");
						setLatestMedia(media.data);
						setSkeletonStateCarousel(true);
					});
				});
			});
		} else {
			currentUser().then((usr) => {
				setUser(usr.data);
				userLibs().then((libs) => {
					setUserLibraries(libs.data.Items);
					setSkeletonStateSideMenu(true);
				});
				getLatestMedia(usr.data).then((media) => {
					setLatestMedia(media.data);
					setSkeletonStateCarousel(true);
				});
			});
		}
	}, []);

	return (
		<>
			<Box
				sx={{
					display: "flex",
				}}
			>
				<AppBar
					position="fixed"
					open={drawerState}
					color="primary"
					elevation={0}
				>
					<Toolbar>
						<IconButton
							color="inherit"
							aria-label="open drawer"
							onClick={handleDrawerOpen}
							edge="start"
							sx={{
								marginRight: 5,
								...(drawerState && { display: "none" }),
							}}
						>
							<MenuIcon />
						</IconButton>
					</Toolbar>
				</AppBar>

				<MiniDrawer
					variant="permanent"
					open={false}
					PaperProps={{
						sx: {
							backgroundColor: "inherit",
							border: "none",
							width: `calc(${theme.spacing(7)} + 10px)`,
						},
					}}
				>
					<DrawerHeader
						className="Mui-DrawerHeader"
						sx={{ position: "relative" }}
					>
						{/* <div>
						<Avatar src={""}/>
						<Typography variant="h3">
						{user["Name"]}
						</Typography>
					</div> */}
						<IconButton
							onClick={handleDrawerClose}
							sx={{
								position: "absolute",
								top: "10%",
								right: "5%",
								opacity: drawerState ? 1 : 0,
							}}
						>
							<Close />
						</IconButton>
					</DrawerHeader>
					<Divider />
					{skeletonStateSideMenu ? (
						<List sx={{ border: "none" }}>
							{userLibraries.map((library, index) => {
								return (
									<Tooltip
										title={library.Name}
										placement="right"
										arrow
										followCursor
										key={index}
									>
										<ListItem disablePadding>
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
														mr: drawerState
															? 3
															: "auto",
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
											</ListItemButton>
										</ListItem>
									</Tooltip>
								);
							})}
						</List>
					) : (
						<>
							<Skeleton
								height="100%"
								variant="rounded"
								width="calc(100% - 10px )"
								sx={{ margin: "5px" }}
							></Skeleton>
						</>
					)}
				</MiniDrawer>

				<MuiDrawer
					anchor="left"
					open={drawerState}
					onClose={handleDrawerClose}
				>
					<DrawerHeader
						className="Mui-DrawerHeader"
						sx={{ position: "relative", height: "20vh" }}
					>
						{/* <div>
						<Avatar src={""}/>
						<Typography variant="h3">
						{user["Name"]}
						</Typography>
					</div> */}
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
				</MuiDrawer>
				{/* <h1>Hey {userId} this is WIP Home</h1> */}
				<Box
					component="main"
					className="scrollY"
					sx={{ flexGrow: 1, p: 3 }}
				>
					<DrawerHeader />
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
						{skeletonStateCarousel ? (
							latestMedia.map((item, index) => {
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
											>
												{item.Name}
											</Typography>
											<Typography
												variant="subtitle1"
												className="hero-carousel-text"
											>
												{item.Overview}
											</Typography>
										</Box>
									</Paper>
								);
							})
						) : (
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
