/** @format */

import React, { useState, useEffect } from "react";

import useKonami from "react-use-konami";

import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider, useSnackbar } from "notistack";
import {
	Routes,
	Route,
	useNavigate,
	useLocation,
	Outlet,
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

import {
	delServer,
	getDefaultServer,
	getServer,
} from "./utils/storage/servers.js";
import { delUser, getUser } from "./utils/storage/user.js";

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

import { createApi, useApi } from "./utils/store/api.js";
import { useQuery } from "@tanstack/react-query";
import { CircularProgress } from "@mui/material";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

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

const LogicalRoute = () => {
	const [api] = useApi((state) => [state.api]);
	const navigate = useNavigate();
	const defaultServer = useQuery({
		queryKey: ["routing", "defaultServer"],
		queryFn: async () => {
			return await getDefaultServer();
		},
	});
	const server = useQuery({
		queryKey: ["routing", "server"],
		queryFn: async () => {
			const result = await getServer(defaultServer.data);
			return result;
		},
		enabled: defaultServer.isSuccess,
	});
	const userSaved = useQuery({
		queryKey: ["routing", "savedUser"],
		queryFn: async () => await getUser(),
	});
	const authenticateUser = async () => {
		const res = await api.authenticateUserByName(
			userSaved.data.Name,
			userSaved.data.Password,
		);
		return res;
	};
	useEffect(() => {
		if (
			!defaultServer.isPending &&
			!server.isPending &&
			!userSaved.isPending
		) {
			if (defaultServer.data) {
				if (userSaved.data) {
					authenticateUser();
					navigate("/home");
					// return <Navigate replace to={} />;
				} else {
					createApi(server.data.address);
					navigate("/login/index");
					// return <Navigate replace to={`/login/index`} />;
				}
			} else {
				navigate("/setup/server");
				// return <Navigate replace to={`/setup/server`} />;
			}
		}
	}, []);
	return (
		<div
			style={{
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
			}}
		>
			<CircularProgress size={84} thickness={1} />
		</div>
	);
};

const LoginRoute = () => {
	const navigate = useNavigate();
	// <Navigate replace to="/login/users" />;
	const [api] = useApi((state) => [state.api]);
	const usersList = useQuery({
		queryKey: ["public-users"],
		queryFn: async () => {
			const result = await getUserApi(api).getPublicUsers();
			return result.data;
		},
		enabled: Boolean(api),
	});

	useEffect(() => {
		if (usersList.isSuccess) {
			if (usersList.data.length > 0) {
				navigate("/login/users");
				// <Navigate replace to="/login/users" />;
			} else {
				navigate("/login/manual");
				// <Navigate replace to="/login/manual" />;
			}
		}
	}, []);
	return (
		<div
			style={{
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
			}}
		>
			<CircularProgress size={84} thickness={1} />
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
	/**
	 * @type {[import("@jellyfin/sdk").Api]}
	 */
	const [api] = useApi((state) => [state.api]);

	const [serverReachable] = useState(true);

	const [playbackDataLoading] = usePlaybackDataLoadStore((state) => [
		state.isPending,
	]);

	const { enqueueSnackbar } = useSnackbar();

	const serverSaved = async () => {
		const defaultServer = await getDefaultServer();
		if (defaultServer) {
			return defaultServer;
		} else {
			return false;
		}
	};

	const handleRelaunch = async (event, reason) => {
		if (reason && reason == "backdropClick") {
			return;
		}
		await relaunch();
	};

	const handleRemoveServer = async () => {
		await delServer();
		await delUser();
		await relaunch();
	};

	// Create api if not created
	useEffect(() => {
		if (!api) {
			serverSaved()
				.then(async (server) => {
					if (server) {
						const savedServer = await getServer(server);
						createApi(savedServer.address);
					}
				})
				.catch((error) => {
					console.error(error);
					enqueueSnackbar(String(error), { variant: "error" });
				});
		}
	}, [api]);

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
				<Dialog
					open={!serverReachable}
					onClose={handleRelaunch}
					aria-labelledby="alert-dialog-text"
					aria-describedby="alert-dialog-desc"
					maxWidth="md"
					sx={{
						padding: "1em",
					}}
				>
					<DialogTitle id="alert-dialog-text">
						Unable to reach server
					</DialogTitle>
					<DialogContent>
						<DialogContentText id="alert-dialog-desc">
							Unable to connect to the jellyfin server.
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleRemoveServer}>
							Remove Server
						</Button>
						<Button onClick={handleRelaunch}>
							Restart JellyPlayer
						</Button>
					</DialogActions>
				</Dialog>
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
					className={audioPlayerVisible ? "audio-playing" : ""}
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
								element={<LogicalRoute />}
								// element={<></>}
							/>
							<Route
								path="/login/index"
								exact
								element={<LoginRoute />}
							/>

							<Route path="/home" element={<Home />} />
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
							<Route path="/about" element={<About />} />
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

export default App;
