/** @format */

import React, { useState, Suspense } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { useCookies, Cookies } from "react-cookie";
import {
	Routes,
	Route,
	Navigate,
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
import { ServerSetup, ServerList } from "./routes/setup/server/root";
import Home from "./routes/home/root";
import {
	UserLogin,
	LoginWithImage,
	UserLoginManual,
} from "./routes/login/root";

import { SideMenu } from "./components/menu/sidemenu.jsx";

// Fonts
import "@fontsource/open-sans";

// Jellyfin SDK TypeScript
import { Jellyfin } from "@jellyfin/sdk";
import { version as appVer } from "../package.json";
import { v4 as uuidv4 } from "uuid";
import { delServer, getServer } from "./utils/storage/servers.js";
import { getUser } from "./utils/storage/user.js";

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
	window.api = jellyfin.createApi(
		serverAddress,
		sessionStorage.getItem("accessToken"),
	);
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
		opacity: 0,
		x: -50,
	},
	animate: {
		opacity: 1,
		x: 0,
	},
	exit: {
		opacity: 0,
		x: 50,
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
				duration: 0.3,
				ease: "easeInOut",
			}}
		>
			<Outlet />
		</motion.div>
	);
};

function App() {
	const [userCookies] = useCookies(["user"]);
	const navigate = useNavigate();

	const [serverReachable, setServerReachable] = useState(true);
	const [checkingServer, setChecking] = useState(false);

	const serverAvailable = async () => {
		const server = await getServer();

		if (server == null) {
			console.log("server not found");
			return false;
		} else {
			if (!window.api) {
				console.log("Creating Jf api (without accessToken)");
				event.emit("create-jellyfin-api", server.Ip);
			}
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
		console.log("User store => ", user);
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
				console.error(error);
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

		navigate("/home");
	};

	const LogicalRoutes = () => {
		serverAvailable().then(async (server) => {
			if (server == true) {
				pingServer();
				if (serverReachable == true) {
					userSaved().then((user_available) => {
						if (user_available == true) {
							userLogin();
						} else {
							usersAvailable().then(
								(users_list_available) => {
									if (users_list_available == true) {
										navigate("/login/users");
									} else {
										navigate("/login/manual");
									}
								},
							);
						}
					});
				}
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
		await relaunch();
	};

	const handleRemoveServer = async () => {
		await delServer();
	};
	const location = useLocation();

	return (
		<SnackbarProvider maxSnack={5}>
			<ThemeProvider theme={theme}>
				{checkingServer && (
					<Box
						sx={{
							display: "flex",
							width: "100%",
							height: "100%",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<CircularProgress />
					</Box>
				)}
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
						<Suspense
							fallback={
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
							}
						>
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
										exact
										path="/login/withImg/:userName/:userId/"
										element={<LoginWithImage />}
									/>
									<Route
										exact
										path="/login/users"
										element={<UserLogin />}
									/>
									<Route
										path="/login/manual"
										element={<UserLoginManual />}
									/>
									<Route
										path="/library/:id"
										element={<></>}
									/>

									{/* Logical Routes */}

									<Route
										path="/"
										element={<LogicalRoutes />}
									/>
									<Route
										exact
										path="/login"
										element={
											<LoginLogicalRoutes />
										}
									/>
								</Route>
							</Routes>
						</Suspense>
					</div>
				</AnimatePresence>
				<ReactQueryDevtools />
			</ThemeProvider>
		</SnackbarProvider>
	);
}

export default App;
