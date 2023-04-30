/** @format */

import React, { useState } from "react";

import Konami from "react-konami-code";
// @ts-ignore
const Kon = Konami.default ? Konami.default : Konami;

import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
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

import { useQuery } from "@tanstack/react-query";
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
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

// Routes
import { ServerSetup, ServerList } from "./routes/setup/server";
import Home from "./routes/home";
import { UserLogin, LoginWithImage, UserLoginManual } from "./routes/login";
import LibraryView from "./routes/library";
import ItemDetail from "./routes/item";
import Settings from "./routes/settings";
import About from "./routes/about";

import { SideMenu } from "./components/menu/sidemenu.jsx";
import { AppBar } from "./components/appBar/appBar.jsx";

// Fonts
import "@fontsource/open-sans";

// Jellyfin SDK TypeScript
import { Jellyfin } from "@jellyfin/sdk";
import { version as appVer } from "../package.json";
import { v4 as uuidv4 } from "uuid";
import { delServer, getServer } from "./utils/storage/servers.js";
import { delUser, getUser } from "./utils/storage/user.js";

import { useDispatch } from "react-redux";
import { showSidemenu } from "./utils/slice/sidemenu.js";
import FavouritePage from "./routes/favourite/index.jsx";
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

	const dispatch = useDispatch();

	const [serverReachable, setServerReachable] = useState(true);
	const [checkingServer, setChecking] = useState(false);

	const createApi = async () => {
		const server = await getServer();
		event.emit("create-jellyfin-api", server.Ip);
		dispatch(showSidemenu());
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

	const pingServer = () => {
		setChecking(true);
		let data;
		fetch(`${window.api.basePath}/System/Ping`, {
			body: JSON.stringify(data),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data == "Jellyfin Server") {
					setServerReachable(true);
					setChecking(false);
				} else {
					enqueueSnackbar(
						"The server address does not seem be a jellyfin server",
						{ variant: "error" },
					);
					setServerReachable(false);
					setChecking(false);
				}
			})
			.catch((error) => {
				setServerReachable(false);
				setChecking(false);
			});
	};

	const userLogin = async () => {
		const user = await getUser();
		const auth = await api.authenticateUserByName(
			user.Name,
			user.Password,
		);
		sessionStorage.setItem("accessToken", auth.data.AccessToken);
		event.emit("set-api-accessToken", window.api.basePath);

		// navigate("/home");
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
				setChecking(false);
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

	const handleRelaunch = async () => {
		let result = await relaunch();
	};

	const handleRemoveServer = async () => {
		await delServer();
		await delUser();
		let result = await relaunch();
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
	const [easterEgg, setEasterEgg] = useState(false);
	const sixtyNine = () => {
		setEasterEgg(true);
	};

	return (
		<SnackbarProvider maxSnack={5}>
			<ThemeProvider theme={theme}>
				{checkingServer && (
					<Box
						sx={{
							display: "flex",
							width: "100%",
							height: "100vh",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<CircularProgress />
					</Box>
				)}

				<Kon resetDelay={1000} action={sixtyNine}></Kon>
				<Dialog
					open={easterEgg}
					onClose={() => setEasterEgg(false)}
				>
					<iframe
						width="560"
						height="315"
						src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0&autoplay=1"
						title="EasterEgg"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					></iframe>
				</Dialog>
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
				<AnimatePresence>
					<div style={{ display: "flex" }}>
						<CssBaseline />
						<SideMenu />
						<AppBar />
						<Routes
							key={location.pathname}
							location={location}
						>
							<Route element={<AnimationWrapper />}>
								{/* Main Routes */}
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
									path="/library/:id"
									element={<LibraryView />}
								/>
								<Route
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
								<Route
									path="/about"
									element={<About />}
								/>

								{/* Logical Routes */}

								<Route
									path="/"
									element={<LogicalRoutes />}
								/>
								<Route
									path="/login"
									element={<LoginLogicalRoutes />}
								/>
							</Route>
						</Routes>
					</div>
				</AnimatePresence>
				<ReactQueryDevtools />
			</ThemeProvider>
		</SnackbarProvider>
	);
}

export default App;
