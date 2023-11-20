/** @format */

import React, { useState, useEffect } from "react";

import useKonami from "react-use-konami";

import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import {
	Routes,
	Route,
	useNavigate,
	useLocation,
	Outlet,
	Navigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { relaunch } from "@tauri-apps/api/process";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

// Theming
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";
import "./styles/global.scss";

// MUI
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import LinearProgress from "@mui/material/LinearProgress";

// Routes
import { ServerSetup } from "./routes/setup/server";
import ServerList from "./routes/setup/serverList/index.jsx";
import Home from "./routes/home";
import { UserLogin, LoginWithImage, UserLoginManual } from "./routes/login";
import LibraryView from "./routes/library";
import ItemDetail from "./routes/item";
import SeriesTitlePage from "./routes/series/index.jsx";
import FavoritePage from "./routes/favorite/index.jsx";
import Settings from "./routes/settings";
import About from "./routes/about";
import SearchPage from "./routes/search";

import { VideoPlayer } from "./routes/player/videoPlayer.jsx";

import { SideMenu } from "./components/menu/sidemenu.jsx";
import { AppBar } from "./components/appBar/appBar.jsx";

// Fonts
import "@fontsource/noto-sans/100.css";
import "@fontsource/noto-sans/100-italic.css";
import "@fontsource/noto-sans/200.css";
import "@fontsource/noto-sans/200-italic.css";
import "@fontsource/noto-sans/300.css";
import "@fontsource/noto-sans/300-italic.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/400-italic.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/500-italic.css";
import "@fontsource/noto-sans/600.css";
import "@fontsource/noto-sans/600-italic.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-sans/700-italic.css";
import "@fontsource/noto-sans/800.css";
import "@fontsource/noto-sans/800-italic.css";
import "@fontsource/noto-sans/900.css";
import "@fontsource/noto-sans/900-italic.css";
import "material-symbols";
import "@fontsource-variable/jetbrains-mono";

import { useBackdropStore } from "./utils/store/backdrop.js";
import { usePlaybackDataLoadStore } from "./utils/store/playback.js";
import BoxSetTitlePage from "./routes/boxset/index.jsx";
import PersonTitlePage from "./routes/person/index.jsx";
import MusicAlbumTitlePage from "./routes/album/index.jsx";
import AudioPlayer from "./components/playback/audioPlayer/index.jsx";
import { useAudioPlayback } from "./utils/store/audioPlayback.js";
import ArtistTitlePage from "./routes/artist/index.jsx";
import EpisodeTitlePage from "./routes/episode/index.jsx";
import PlaylistTitlePage from "./routes/playlist/index.jsx";

import { useApi } from "./utils/store/api.js";
import { useQuery } from "@tanstack/react-query";
import { CircularProgress } from "@mui/material";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useCentralStore } from "./utils/store/central.js";

const anim = {
	initial: {
		transform: "scale(0.98)",
		opacity: 0,
	},
	animate: {
		transform: "scale(1)",
		opacity: 1,
	},
	exit: {
		transform: "sscale(1.02)",
		opacity: 0,
	},
};

const LoginRoute = () => {
	const navigate = useNavigate();
	const [api] = useApi((state) => [state.api]);

	const usersList = useQuery({
		queryKey: ["public-users"],
		queryFn: async () => {
			const result = await getUserApi(api).getPublicUsers();
			return result.data;
		},
		enabled: Boolean(api),
	});
	if (usersList.isSuccess && !usersList.isFetching) {
		if (usersList.data.length > 0) {
			navigate("/login/users");
		} else {
			navigate("/login/manual");
		}
	}
	return (
		<div
			style={{
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
			}}
		>
			<CircularProgress size={72} thickness={1.4} />
		</div>
	);
};

const AnimationWrapper = () => {
	return (
		<motion.div
			className="root-page"
			variants={anim}
			initial="initial"
			animate="animate"
			exit="exit"
			transition={{
				duration: 0.25,
				ease: "easeInOut",
			}}
		>
			<Outlet />
		</motion.div>
	);
};

function App() {
	const [playbackDataLoading] = usePlaybackDataLoadStore((state) => [
		state.isPending,
	]);

	const handleRelaunch = async (event, reason) => {
		if (reason && reason == "backdropClick") {
			return;
		}
		await relaunch();
	};

	const location = useLocation();

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [location.key]);

	const [audioPlayerVisible] = useAudioPlayback((state) => [state.display]);

	const [backdropUrl, backdropId] = useBackdropStore((state) => [
		state.backdropUrl,
		state.backdropId,
	]);

	const [backdropLoading, setBackdropLoading] = useState(true);

	const [easterEgg, setEasterEgg] = useState(false);
	const sixtyNine = () => {
		setEasterEgg(true);
	};

	useKonami(sixtyNine, {
		code: [
			"ArrowUp",
			"ArrowUp",
			"ArrowDown",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			"ArrowLeft",
			"ArrowRight",
			"b",
			"a",
		],
	});

	const [initialRoute] = useCentralStore((state) => [state.initialRoute]);

	const navigate = useNavigate();
	if (!initialRoute) {
		return (
			<div
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
				}}
			>
				<CircularProgress size={72} thickness={1.4} />
			</div>
		);
	} else if (initialRoute) {
		return (
			<SnackbarProvider maxSnack={5}>
				<ThemeProvider theme={theme}>
					{playbackDataLoading && (
						<LinearProgress
							sx={{
								position: "fixed",
								top: 0,
								left: 0,
								right: 0,
								width: "100vw",
								zIndex: 100000,
							}}
						/>
					)}
					<Dialog
						open={easterEgg}
						onClose={() => setEasterEgg(false)}
						sx={{
							background: "black",
						}}
					>
						<iframe
							width="560"
							height="315"
							src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&disablekb=1"
							title="EasterEgg"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						></iframe>
					</Dialog>
					<Slide
						direction="up"
						in={easterEgg}
						mountOnEnter
						unmountOnExit
					>
						<img
							src="https://i.gifer.com/PYh.gif"
							width={320}
							height={320}
							style={{
								zIndex: "99999999",
								position: "fixed",
								bottom: 0,
								left: 0,
								objectFit: "cover",
							}}
						/>
					</Slide>

					{/* Show Dialog if server not reachable */}

					<div className="app-backdrop-container">
						<AnimatePresence>
							<motion.img
								key={backdropId}
								src={backdropUrl}
								alt=""
								className="app-backdrop"
								initial={{
									opacity: 0,
								}}
								animate={{
									opacity: backdropLoading ? 0 : 0.6,
								}}
								exit={{
									opacity: 0,
								}}
								transition={{
									duration: 0.8,
									ease: "easeInOut",
								}}
								onLoadCapture={() => {
									setBackdropLoading(true);
								}}
								onLoad={() => {
									setBackdropLoading(false);
								}}
								loading="eager"
								style={{
									transition: "opacity 0.8s",
								}}
							/>
						</AnimatePresence>
					</div>
					<div
						className={
							audioPlayerVisible ? "audio-playing" : ""
						}
						style={{
							display: "flex",
							width: "100vw",
							transition: "padding 250ms",
						}}
					>
						<CssBaseline />
						<SideMenu />
						<AppBar />
						<AudioPlayer key={audioPlayerVisible} />
						<Routes location={location}>
							<Route
								// key={location.key}
								element={<AnimationWrapper />}
							>
								<Route
									path="/"
									exact
									element={
										<Navigate to={initialRoute} />
									}
									// element={<></>}
								/>
								<Route
									path="/error"
									element={
										<Dialog
											open
											onClose={handleRelaunch}
											aria-labelledby="alert-dialog-text"
											aria-describedby="alert-dialog-desc"
											maxWidth="md"
										>
											<DialogTitle id="alert-dialog-text">
												Unable to reach
												server
											</DialogTitle>
											<DialogContent>
												<DialogContentText id="alert-dialog-desc">
													Unable to
													connect to the
													jellyfin
													server.
												</DialogContentText>
											</DialogContent>
											<DialogActions>
												<Button
													onClick={() =>
														navigate(
															"/servers/list",
														)
													}
												>
													Change Server
												</Button>
												<Button
													variant="outlined"
													onClick={
														handleRelaunch
													}
												>
													Restart
													JellyPlayer
												</Button>
											</DialogActions>
										</Dialog>
									}
								/>
								<Route
									path="/login/index"
									exact
									element={<LoginRoute />}
								/>

								<Route
									path="/home"
									element={<Home />}
								/>
								<Route
									path="/setup/server"
									element={<ServerSetup />}
								/>
								<Route
									path="/servers/list"
									element={<ServerList />}
								/>
								<Route
									path="/login/withImg/:userName/:userId/"
									element={<LoginWithImage />}
								/>
								<Route
									path="/login/users"
									element={<UserLogin />}
								/>
								<Route
									path="/login/manual"
									element={<UserLoginManual />}
								/>
								<Route
									exact
									path="/library/:id"
									element={<LibraryView />}
								/>
								<Route
									exact
									path="/item/:id"
									element={<ItemDetail />}
								/>
								<Route
									exact
									path="/musicalbum/:id"
									element={<MusicAlbumTitlePage />}
								/>
								<Route
									exact
									path="/artist/:id"
									element={<ArtistTitlePage />}
								/>
								<Route
									exact
									path="/boxset/:id"
									element={<BoxSetTitlePage />}
								/>
								<Route
									exact
									path="/episode/:id"
									element={<EpisodeTitlePage />}
								/>
								<Route
									exact
									path="/person/:id"
									element={<PersonTitlePage />}
								/>
								<Route
									exact
									path="/playlist/:id"
									element={<PlaylistTitlePage />}
								/>
								<Route
									path="/series/:id"
									element={<SeriesTitlePage />}
								/>
								<Route
									path="/search"
									element={<SearchPage />}
								/>
								<Route
									path="/favorite"
									element={<FavoritePage />}
								/>
								<Route
									path="/settings"
									element={<Settings />}
								/>
								<Route
									path="/about"
									element={<About />}
								/>
								<Route
									path="/player"
									element={<VideoPlayer />}
								/>
							</Route>
						</Routes>
					</div>
					<ReactQueryDevtools />
				</ThemeProvider>
			</SnackbarProvider>
		);
	}
}

export default App;
