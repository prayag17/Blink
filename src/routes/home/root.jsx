/** @format */

import { useState, useEffect } from "react";
import { Cookies } from "react-cookie";

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

const drawerWidth = 320;

const openedMixin = (theme) => ({
	width: drawerWidth,
	transition: theme.transitions.create("width", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen,
	}),
	overflowX: "hidden",
});

const closedMixin = (theme) => ({
	transition: theme.transitions.create("width", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	overflowX: "hidden",
	width: `calc(${theme.spacing(7)} + 1px)`,
	[theme.breakpoints.up("sm")]: {
		width: `calc(${theme.spacing(8)} + 1px)`,
	},
});

const DrawerHeader = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
	...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
	shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
	width: drawerWidth,
	flexShrink: 0,
	whiteSpace: "nowrap",
	boxSizing: "border-box",
	backgroundColor: theme.palette.primary.background.dark,
	...(open && {
		...openedMixin(theme),
		"& .MuiDrawer-paper": openedMixin(theme),
	}),
	...(!open && {
		...closedMixin(theme),
		"& .MuiDrawer-paper": closedMixin(theme),
	}),
}));

const AppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
	zIndex: theme.zIndex.drawer + 1,
	transition: theme.transitions.create(["width", "margin"], {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	backgroundColor: "transparent",
	backgroundImage: "none",
	...(open && {
		marginLeft: drawerWidth,
		width: `calc(100% - ${drawerWidth}px)`,
		transition: theme.transitions.create(["width", "margin"], {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
	}),
}));

export const Home = () => {
	const [skeletonStateSideMenu, setSkeletonStateSideMenu] = useState(false);
	const [skeletonStateCarousel, setSkeletonStateCarousel] = useState(false);

	const [userLibraries, setUserLibraries] = useState([]);
	const [latestMovies, setLatestMovies] = useState([]);
	const [user, setUser] = useState({
		Name: "",
	});
	const [latestMedia, setLatestMedia] = useState([]);

	const [drawerState, setDrawerState] = useState(false);
	const cookies = new Cookies();

	const scrollTrigger = useScrollTrigger({ threshold: 5 });

	const handleDrawerOpen = () => {
		setDrawerState(true);
	};

	const handleDrawerClose = () => {
		setDrawerState(false);
	};

	const handleLogout = async () => {
		await window.api.logout();
		console.log("logged out user");
	};

	const currentUser = async () => {
		const user = await getUserApi(window.api).getCurrentUser();
		return user;
	};

	const userLibs = async (user) => {
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
	const getLatestMovies = async (user) => {
		const media = await getUserLibraryApi(window.api).getLatestMedia({
			userId: user.Id,
			fields: ["PrimaryImageAspectRatio", "Overview"],
			enableUserData: true,
			includeItemTypes: ["Movie"],
		});
		return media;
	};

	useEffect(() => {
		currentUser().then((usr) => {
			setUser(usr.data);
			userLibs(usr.data).then((libs) => {
				setUserLibraries(libs.data.Items);
				setSkeletonStateSideMenu(true);
				// console.log(userLibraries);
			});
			getLatestMedia(usr.data).then((media) => {
				setLatestMedia(media.data);
				setSkeletonStateCarousel(true);
			});
			getLatestMovies(usr.data).then((media) => {
				setLatestMovies(media.data);
			});
		});
		for (let lib of latestMovies) {
			console.log(lib);
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

				<Drawer
					variant="permanent"
					open={drawerState}
					PaperProps={{
						sx: {
							backgroundColor: "inherit",
							border: "none",
						},
					}}
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
									<ListItem
										disablePadding
										key={index}
									>
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
											<ListItemText
												primary={
													library.Name
												}
												sx={{
													opacity: drawerState
														? 1
														: 0,
												}}
											/>
										</ListItemButton>
									</ListItem>
								);
							})}
						</List>
					) : (
						<>
							<Skeleton
								height={50}
								variant="rectangular"
								animation="wave"
							></Skeleton>
							<br />
							<Skeleton
								height={50}
								variant="rectangular"
								animation="wave"
							></Skeleton>
							<br />
							<Skeleton
								height={50}
								variant="rectangular"
								animation="wave"
							></Skeleton>
						</>
					)}
				</Drawer>
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
