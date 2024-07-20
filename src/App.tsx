import React, { useState, useEffect, useLayoutEffect } from "react";

import { ThemeProvider } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { SnackbarProvider } from "notistack";
import {
	Navigate,
	Route,
	Routes,
	useLocation,
	useNavigate,
} from "react-router-dom";

import { relaunch } from "@tauri-apps/api/process";
import {
	type UpdateManifest,
	checkUpdate,
	installUpdate,
} from "@tauri-apps/api/updater";

// Theming
import CssBaseline from "@mui/material/CssBaseline";
import "./styles/global.scss";
import { theme } from "./theme";

import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";

// MUI
import {
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	LinearProgress,
	SvgIcon,
} from "@mui/material";

// Routes
import About from "./routes/_about";
import MusicAlbumTitlePage from "./routes/album/$id.js";
import ArtistTitlePage from "./routes/artist/$id.js";
import BoxSetTitlePage from "./routes/boxset/$id.js";
import EpisodeTitlePage from "./routes/episode/$id";
import FavoritePage from "./routes/favorite/index.jsx";
import Home from "./routes/home";
import ItemDetail from "./routes/item/$id";
import LibraryView from "./routes/library";
import {
	LoginRoute,
	LoginWithImage,
	UserLogin,
	UserLoginManual,
} from "./routes/login";
import PersonTitlePage from "./routes/person/$id.jsx";
import VideoPlayer from "./routes/player/videoPlayer";
import PlaylistTitlePage from "./routes/playlist/$id.jsx";
import SearchPage from "./routes/search";
import SeriesTitlePage from "./routes/series/$id.js";
import { ServerSetup } from "./routes/setup/server.add";
import ServerList from "./routes/setup/server.list.js";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";


// Components
import { AppBar } from "./components/appBar/appBar.jsx";
import { ErrorNotice } from "./components/notices/errorNotice/errorNotice.jsx";
import AudioPlayer from "./components/playback/audioPlayer/index.jsx";

// Utils
import { useAudioPlayback } from "./utils/store/audioPlayback.js";
import { useBackdropStore } from "./utils/store/backdrop.js";
import { setInitialRoute, useCentralStore } from "./utils/store/central.js";
import {
	usePlaybackDataLoadStore,
	usePlaybackStore,
} from "./utils/store/playback";

// 3rd Party
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { CircularProgress } from "@mui/material";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useSnackbar } from "notistack";
import { ErrorBoundary } from "react-error-boundary";

import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import {
	useIsFetching,
	useIsMutating,
	useQueryClient,
} from "@tanstack/react-query";
import NProgress from "./components/nProgress";
import Settings from "./components/settings";
import { EasterEgg } from "./components/utils/easterEgg.jsx";
import { handleRelaunch } from "./utils/misc/relaunch";
import {
	delServer,
	getAllServers,
	getDefaultServer,
	getServer,
	setDefaultServer,
} from "./utils/storage/servers";
import { type UserStore, delUser, getUser } from "./utils/storage/user";
import { axiosClient, createApi, useApi } from "./utils/store/api";

const handleAuthError = async () => {
	await delUser();
	setInitialRoute("/login/index");
};

const authenticateUser = async (address: string, user: UserStore["user"]) => {
	try {
		createApi(address, user.AccessToken);
		setInitialRoute("/home");
	} catch (error) {
		console.error(error);
		setInitialRoute("/error");
	}
};

const init = async () => {
	if (window.location.pathname !== "/") {
		window.location.href = "/";
		return;
	}

	const defaultServerOnDisk = await getDefaultServer();

	if (defaultServerOnDisk) {
		const defaultServerInfo = await getServer(defaultServerOnDisk);
		if (!defaultServerInfo) {
			await setDefaultServer(null);
			await delServer(defaultServerOnDisk);

			const servers = await getAllServers();

			setInitialRoute(servers.length > 0 ? "/servers/list" : "/setup/server");

			return;
		}

		const userOnDisk = await getUser();
		createApi(defaultServerInfo.address, "");
		try {
			const api = useApi.getState();
			const ping = await getSystemApi(api.api).getPingSystem();
			// const ping = await fetch("http://192.168.29.60:8096/System/Ping");
		} catch (error) {
			console.error(error);
			setInitialRoute("/error");
			return;
		}

		if (userOnDisk) {
			try {
				let authApi = useApi.getState().api;

				if (!authApi) {
					handleAuthError();
					return;
				}

				await authenticateUser(defaultServerInfo.address, userOnDisk);

				authApi = useApi.getState().api!;

				const user = await getUserApi(authApi).getCurrentUser();

				if (!user) {
					await delUser();
					handleAuthError();
				}
			} catch (error) {
				console.error(error);
				handleAuthError();
			}
		} else {
			setInitialRoute("/login/index");
		}
	} else {
		setInitialRoute("/setup/server");
	}
};

function App() {
	const [appReady, setAppReady] = useState(false);

	useEffect(() => {
		init().then(() => {
			setAppReady(true);
		});
	}, []);

	if (!appReady) {
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
	}

	return <AppReady />;
}
function AppReady() {
	const [audioPlayerVisible] = useAudioPlayback((state) => [state.display]);
	const { enqueueSnackbar } = useSnackbar();

	const [initialRoute] = useCentralStore((state) => [state.initialRoute]);
	const [backdropUrl, backdropId] = useBackdropStore((state) => [
		state.backdropUrl,
		state.backdropId,
	]);
	const [playbackDataLoading] = usePlaybackDataLoadStore((state) => [
		state.isPending,
	]);

	const location = useLocation();
	const navigate = useNavigate();

	

	const isQueryFetching = useIsFetching();
	const isMutating = useIsMutating();

	useEffect(() => window.scrollTo(0, 0), [location.key]);

	const [videoPlaybackItem] = usePlaybackStore((state) => [state.item]);



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
	}

	return (
				

				

				{/* Show Dialog if server not reachable */}

				
				<div
					className={audioPlayerVisible ? "audio-playing" : ""}
					style={{
						display: "flex",
						width: "100vw",
						transition: "padding 250ms",
					}}
				>
					
					<ErrorBoundary FallbackComponent={ErrorNotice} key={location.key}>
						<Routes location={location}>
							<Route path="/" element={<Navigate to={initialRoute} />} />
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
											Unable to reach server
										</DialogTitle>
										<DialogContent>
											<DialogContentText id="alert-dialog-desc">
												Unable to connect to the jellyfin server.
											</DialogContentText>
										</DialogContent>
										<DialogActions>
											<Button
												color="secondary"
												variant="contained"
												onClick={() => navigate("/servers/list")}
											>
												Change Server
											</Button>
											<Button
												variant="contained"
												color="primary"
												onClick={handleRelaunch}
											>
												Restart JellyPlayer
											</Button>
										</DialogActions>
									</Dialog>
								}
							/>
							<Route path="/login/index" element={<LoginRoute />} />

							<Route path="/home" element={<Home />} />
							<Route path="/setup/server" element={<ServerSetup />} />
							<Route path="/servers/list" element={<ServerList />} />
							<Route
								path="/login/withImg/:userName/:userId/"
								element={<LoginWithImage />}
							/>
							<Route path="/login/users" element={<UserLogin />} />
							<Route path="/login/manual" element={<UserLoginManual />} />
							<Route path="/library/:id" element={<LibraryView />} />
							<Route path="/item/:id" element={<ItemDetail />} />
							<Route
								path="/musicalbum/:id"
								element={<MusicAlbumTitlePage />}
								errorElement={<div>Error</div>}
							/>
							<Route path="/artist/:id" element={<ArtistTitlePage />} />
							<Route path="/boxset/:id" element={<BoxSetTitlePage />} />
							<Route path="/episode/:id" element={<EpisodeTitlePage />} />
							<Route path="/person/:id" element={<PersonTitlePage />} />
							<Route path="/playlist/:id" element={<PlaylistTitlePage />} />
							<Route path="/series/:id" element={<SeriesTitlePage />} />
							<Route path="/search" element={<SearchPage />} />
							<Route path="/favorite" element={<FavoritePage />} />
							<Route path="/about" element={<About />} />
							<Route
								path="/player"
								element={<VideoPlayer />}
								key={videoPlaybackItem?.Id ?? "noplayback"}
							/>
						</Routes>
					</ErrorBoundary>
				</div>

				<ReactQueryDevtools buttonPosition="bottom-right" position="left" />
			</>
		</SnackbarProvider>
	);
}

export default App;
