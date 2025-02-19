import { AppBar } from "@/components/appBar/appBar";
import NProgress from "@/components/nProgress";
import AudioPlayer from "@/components/playback/audioPlayer";
import Settings from "@/components/settings";
// import { EasterEgg } from "@/components/utils/easterEgg";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { SnackbarProvider } from "notistack";
import React from "react";

import "../styles/global.scss";
import { theme } from "@/theme";

// Fonts
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/noto-sans";
import "@fontsource-variable/plus-jakarta-sans";

import "material-symbols/rounded.scss";
import Backdrop from "@/components/backdrop";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import RouterLoading from "@/components/routerLoading";
import Updater from "@/components/updater";
import type { Api, Jellyfin } from "@jellyfin/sdk";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type ApiContext = {
	api: Api | undefined;
	createApi: (serverAddress: string, accessToken: string | undefined) => void;
	user: UserDto | null | undefined;
	jellyfinSDK: Jellyfin;
	fetchCurrentUser: (api: Api | undefined) => Promise<void>;
};

export const Route = createRootRouteWithContext<ApiContext>()({
	component: () => {
		return (
			<DndProvider backend={HTML5Backend}>
				<ThemeProvider theme={theme}>
					<SnackbarProvider maxSnack={5}>
						<CssBaseline />
						<Settings />
						{/* <EasterEgg /> */}
						<NProgress />

						<RouterLoading />

						<Updater />
						<Backdrop />
						<AppBar />
						<AudioPlayer />
						<Outlet />
						<ReactQueryDevtools />
						{/* <TanStackRouterDevtools /> */}
					</SnackbarProvider>
				</ThemeProvider>
			</DndProvider>
		);
	},
	errorComponent: ErrorNotice,
});