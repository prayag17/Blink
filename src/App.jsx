/** @format */

import { useState, useEffect, useContext } from "react";
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

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

// Theming
import { theme } from "./theme";
import "./styles/global.scss";

// Routes
import { ServerSetup, ServerList } from "./routes/setup/server/root";
import { Home } from "./routes/home/root";
import {
	UserLogin,
	LoginWithImage,
	UserLoginManual,
} from "./routes/login/root";

// Fonts
import "@fontsource/open-sans";

// Jellyfin SDK TypeScript
import { Jellyfin } from "@jellyfin/sdk";
import { version as appVer } from "../package.json";
import { v4 as uuidv4 } from "uuid";

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
	const cookies = new Cookies();

	const serverAvailable = () => {
		try {
			const currentServer = cookies.get("currentServer");
			const serverList = cookies.get("servers");
			let currentServerIp = "";
			serverList.map((item, index) => {
				currentServerIp = item[currentServer];
			});

			if (currentServer == undefined) {
				return false;
			} else {
				if (!window.api) {
					event.emit(
						"create-jellyfin-api",
						currentServerIp.serverAddress,
					);
				}
				return true;
			}
		} catch (error) {
			return false;
		}
	};

	const userSaved = () => {
		try {
			userCookies.user[0];
			return true;
		} catch (error) {
			return false;
		}
	};

	const userAvailable = async () => {
		const users = await getUserApi(window.api).getPublicUsers();
		try {
			if (users.data.length >= 1) {
				return true;
			} else {
				return false;
			}
		} catch (error) {
			return false;
		}
	};

	const HandleLoginRoutes = () => {
		if (userSaved()) {
			navigate("/home");
		} else {
			userAvailable().then((res) => {
				if (res) {
					navigate("/login/users");
				} else if (!res) {
					navigate("/login/manual");
				}
			});
		}
	};

	const location = useLocation();

	return (
		<SnackbarProvider maxSnack={5}>
			<ThemeProvider theme={theme}>
				<AnimatePresence>
					<Routes key={location.pathname} location={location}>
						<Route element={<AnimationWrapper />}>
							{/* Main Routes */}
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

							{/* Logical Routes */}
							<Route
								exact
								path="/login"
								element={
									<HandleLoginRoutes></HandleLoginRoutes>
								}
							/>

							<Route
								path="/"
								element={
									serverAvailable() ? (
										<Navigate to="/login" />
									) : (
										<Navigate to="/setup/server" />
									)
								}
							/>
						</Route>
					</Routes>
				</AnimatePresence>
			</ThemeProvider>
		</SnackbarProvider>
	);
}

export default App;
