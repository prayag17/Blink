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

import { EventEmitter as event } from "./eventEmitter.js";

import { relaunch } from "@tauri-apps/api/process";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

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
import Box from "@mui/material/Box";

// Routes
import { ServerSetup, ServerList } from "./routes/setup/server";
import Home from "./routes/home";
import { UserLogin, LoginWithImage, UserLoginManual } from "./routes/login";
import LibraryView from "./routes/library";
import ItemDetail from "./routes/item";
import FavouritePage from "./routes/favourite/index.jsx";
import Settings from "./routes/settings";
import About from "./routes/about";

import { VideoPlayer } from "./routes/player/videoPlayer.jsx";

import { SideMenu } from "./components/menu/sidemenu.jsx";
import { AppBar } from "./components/appBar/appBar.jsx";

// Fonts
import "@fontsource-variable/open-sans"; // Defaults to wght axis
import "@fontsource-variable/open-sans/wght.css"; // Specify axis
import "@fontsource-variable/open-sans/wght-italic.css"; // Specify axis and style

// Jellyfin SDK TypeScript
import {
	Jellyfin,
	VersionOutdatedIssue,
	VersionUnsupportedIssue,
} from "@jellyfin/sdk";
import { version as appVer } from "../package.json";
import { v4 as uuidv4 } from "uuid";
import { delServer, getServer } from "./utils/storage/servers.js";
import { delUser, getUser } from "./utils/storage/user.js";

import axios from "axios";
import { useBackdropStore } from "./utils/store/backdrop.js";

const jellyfin = new Jellyfin({
	clientInfo: {
		name: "JellyPlayer",
		version: appVer,
	},
	deviceInfo: {
		name: "JellyPlayer",
		id: uuidv4(),
	},
});

event.on("create-jellyfin-api", (serverAddress) => {
	window.api = jellyfin.createApi(serverAddress);
	// window.api = jellyfin.createApi(serverAddress);
});
event.on("set-api-accessToken", (serverAddress) => {
	window.api = jellyfin.createApi(
		serverAddress,
		sessionStorage.getItem("accessToken"),
	);
});

const anim = {
	initial: {
		transform: "scale(0.99)",
		opacity: 0,
	},
	animate: {
		transform: "scale(1)",
		opacity: 1,
	},
	exit: {
		transform: "scale(0.99)",
		opacity: 0,
	},
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
				duration: 0.35,
			}}
		>
			<Outlet />
		</motion.div>
	);
};

function App() {
	const navigate = useNavigate();

	const [serverReachable, setServerReachable] = useState(true);

	const { enqueueSnackbar } = useSnackbar();

	const createApi = async () => {
		const server = await getServer();
		event.emit("create-jellyfin-api", server.Ip);
	};

	const serverAvailable = async () => {
		const server = await getServer();

		if (server == null) {
			return false;
		} else {
			return true;
		}
	};

	const usersAvailable = async () => {
		const users = await getUserApi(window.api).getPublicUsers();
		if (users.data.length >= 1) {
			return true;
		} else {
			return false;
		}
	};

	const userSaved = async () => {
		const user = await getUser();
		if (user == null) {
			return false;
		} else {
			return true;
		}
	};

	const pingServer = async () => {
		const server = await getServer();
		try {
			const result = await axios.get(
				new URL(`${server.Ip}/System/Ping`).href,
			);
			if (result.data == "Jellyfin Server") {
				event.emit("create-jellyfin-api", server.Ip);
				setServerReachable(true);
			} else {
				setServerReachable(false);
			}
		} catch (error) {
			setServerReachable(false);
			enqueueSnackbar("Unable to verfiy server address.", {
				variant: "error",
			});
			console.error(error);
		}
	};

	const userLogin = async () => {
		const user = await getUser();
		const auth = await api.authenticateUserByName(
			user.Name,
			user.Password,
		);
		sessionStorage.setItem("accessToken", auth.data.AccessToken);
		event.emit("set-api-accessToken", window.api.basePath);
	};

	const LogicalRoutes = () => {
		serverAvailable().then(async (server) => {
			if (server == true) {
				createApi().then(() => {
					pingServer();
					if (serverReachable == true) {
						userSaved().then((user_available) => {
							if (user_available == true) {
								navigate("/home");
							} else {
								usersAvailable().then(
									(users_list_available) => {
										if (
											users_list_available ==
											true
										) {
											navigate("/login/users");
										} else {
											navigate(
												"/login/manual",
											);
										}
									},
								);
							}
						});
					}
				});
			} else {
				navigate("/setup/server");
			}
		});
	};

	const LoginLogicalRoutes = () => {
		usersAvailable().then((users_list_available) => {
			if (users_list_available == true) {
				navigate("/login/users");
			} else {
				navigate("/login/manual");
			}
		});
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
	const location = useLocation();

	if (!window.api) {
		serverAvailable().then((available) => {
			if (available) {
				createApi().then(
					userSaved().then((userSavedBool) => {
						if (userSavedBool) {
							userLogin();
						}
					}),
				);
			}
		});
	}

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
						frameborder="0"
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
				<Box className="app-backdrop-container">
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
								opacity: backdropLoading ? 0 : 0.5,
							}}
							exit={{
								opacity: 0,
							}}
							transition={{
								duration: 1.5,
							}}
							onLoad={() => setBackdropLoading(false)}
							loading="eager"
						/>
					</AnimatePresence>
				</Box>
				<div
					style={{
						display: "flex",
						width: "100vw",
					}}
				>
					<CssBaseline />
					<SideMenu />
					<AppBar />
					<Routes key={location.key} location={location}>
						<Route element={<AnimationWrapper />}>
							<Route
								path="/"
								element={<LogicalRoutes />}
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
								path="/favourite"
								element={<FavouritePage />}
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

							<Route
								path="/login"
								element={<LoginLogicalRoutes />}
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
