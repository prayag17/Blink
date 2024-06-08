import { AppBar } from "@/components/appBar/appBar";
import NProgress from "@/components/nProgress";
import AudioPlayer from "@/components/playback/audioPlayer";
import Settings from "@/components/settings";
import { EasterEgg } from "@/components/utils/easterEgg";
import { useBackdropStore } from "@/utils/store/backdrop";
import { LoadingButton } from "@mui/lab";
import {
	Button,
	Chip,
	CircularProgress,
	CssBaseline,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	SvgIcon,
	ThemeProvider,
} from "@mui/material";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import {
	Outlet,
	ScrollRestoration,
	createRootRouteWithContext,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { relaunch } from "@tauri-apps/api/process";
import {
	type UpdateManifest,
	checkUpdate,
	installUpdate,
} from "@tauri-apps/api/updater";
import { AnimatePresence, motion } from "framer-motion";
import { SnackbarProvider, useSnackbar } from "notistack";
import React, { Suspense, useEffect, useLayoutEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "../styles/global.scss";
import { theme } from "@/theme";

// Fonts
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/noto-sans";

import "material-symbols/rounded.scss";
import type { Api } from "@jellyfin/sdk";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

type ApiContext = {
	api: Api;
	createApi: (
		serverAddress: string | undefined,
		accessToken: string | undefined,
	) => void;
};

export const Route = createRootRouteWithContext<ApiContext>()({
	errorComponent: (error) => {
		console.error(error.error);
	},
	component: () => {
		const isQueryFetching = useIsFetching();
		const isMutating = useIsMutating();
		const routeIsLoading = useRouterState().isLoading;
		const [updateDialog, setUpdateDialog] = useState(false);
		const [updateDialogButton, setUpdateDialogButton] = useState(false);
		const [updateInfo, setUpdateInfo] = useState<UpdateManifest | undefined>(
			undefined,
		);
		useLayoutEffect(() => {
			async function checkForUpdates() {
				try {
					const { shouldUpdate, manifest } = await checkUpdate();

					if (shouldUpdate) {
						setUpdateInfo(manifest);
						setUpdateDialog(true);

						console.log(
							`Update found : ${manifest?.version}, ${manifest?.date}`,
						);
					}
				} catch (error) {
					console.error(error);
				}
			}
			checkForUpdates();
		}, []);
		const { enqueueSnackbar } = useSnackbar();
		const [backdropUrl, backdropId] = useBackdropStore((state) => [
			state.backdropUrl,
			state.backdropId,
		]);

		const [backdropLoading, setBackdropLoading] = useState(true);
		// Reset BackdropImageLoading for every new image
		useEffect(() => {
			setBackdropLoading(true);
		}, [backdropId]);
		return (
			<Suspense fallback={<h1>Loading...</h1>}>
				<ThemeProvider theme={theme}>
					<SnackbarProvider maxSnack={5}>
						<CssBaseline />
						<ScrollRestoration />
						<Settings />
						<EasterEgg />
						<NProgress
							isAnimating={isQueryFetching || isMutating || routeIsLoading}
						/>

						{routeIsLoading && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								style={{
									width: "100vw",
									height: "100vh",
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									background: "rgb(0 0 0 / 0.35)",
									position: "fixed",
									zIndex: 10000,
								}}
							>
								<CircularProgress size={72} thickness={2} />
							</motion.div>
						)}

						<Dialog
							open={updateDialog}
							fullWidth
							PaperProps={{
								style: {
									borderRadius: "14px",
									background: "rgb(0 0 0 / 0.5)",
									backdropFilter: "blur(10px)",
									border: "1px solid rgb(255 255 255 / 0.2)",
								},
							}}
							sx={{
								"& img": {
									width: "100%",
								},
							}}
						>
							{updateInfo !== undefined && (
								<>
									<DialogTitle
										variant="h5"
										style={{
											display: "flex",
											flexDirection: "column",
											alignItems: "flex-start",
											gap: "0.4em",
										}}
									>
										Update Available!
										<Chip
											icon={
												<span className="material-symbols-rounded">update</span>
											}
											label={`v${updateInfo.version}`}
											color="success"
										/>
									</DialogTitle>
									<DialogContent dividers>
										<DialogContentText>
											<Markdown remarkPlugins={[remarkGfm]}>
												{updateInfo.body}
											</Markdown>
										</DialogContentText>
									</DialogContent>
									<DialogActions
										style={{
											padding: "1em",
										}}
									>
										<IconButton
											disabled={updateDialogButton}
											target="_blank"
											href={`https://github.com/prayag17/JellyPlayer/releases/${updateInfo.version}`}
										>
											<SvgIcon>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="16"
													height="16"
													fill="currentColor"
													viewBox="0 0 16 16"
												>
													<title>Update</title>
													<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8" />
												</svg>
											</SvgIcon>
										</IconButton>
										<Button
											size="large"
											color="error"
											variant="outlined"
											disabled={updateDialogButton}
											onClick={() => setUpdateDialog(false)}
										>
											close
										</Button>
										<LoadingButton
											size="large"
											color="success"
											variant="contained"
											loading={updateDialogButton}
											loadingIndicator="Updating..."
											onClick={async () => {
												setUpdateDialogButton(true);
												await installUpdate();
												enqueueSnackbar(
													"Update has been installed! You need to relaunch JellyPlayer.",
													{
														variant: "success",
													},
												);
												await relaunch();
											}}
										>
											Update
										</LoadingButton>
									</DialogActions>
								</>
							)}
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
										opacity: backdropLoading ? 0 : 1,
									}}
									exit={{
										opacity: 0,
									}}
									transition={{
										opacity: {
											duration: 1.2,
										},
									}}
									onLoad={() => setBackdropLoading(false)}
									loading="lazy"
								/>
							</AnimatePresence>
						</div>
						<AppBar />
						<AudioPlayer />
						<Outlet />
						<ReactQueryDevtools />
						<TanStackRouterDevtools />
					</SnackbarProvider>
				</ThemeProvider>
			</Suspense>
		);
	},
});