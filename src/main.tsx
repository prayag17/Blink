/** @format */

import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter as Router } from "react-router-dom";

import App from "./App";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	delServer,
	getAllServers,
	getDefaultServer,
	getServer,
	setDefaultServer,
} from "./utils/storage/servers";
import { getUser } from "./utils/storage/user";
import { createApi, useApi } from "./utils/store/api";
import { setInitialRoute } from "./utils/store/central";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			networkMode: "always",
			gcTime: 120000,
		},
		mutations: {
			networkMode: "always",
		},
	},
});

const init = async () => {
	const defaultServerOnDisk = await getDefaultServer();
	if (defaultServerOnDisk) {
		// This will be defined as we have a default server
		const defaultServerInfo = await getServer(defaultServerOnDisk);

		if (!defaultServerInfo) {
			await setDefaultServer(null);
			await delServer(defaultServerOnDisk);

			const servers = await getAllServers();

			if (servers.length > 0) {
				setInitialRoute("/servers/list");
			} else {
				setInitialRoute("/setup/server");
			}

			return;
		}

		const userOnDisk = await getUser();

		createApi(defaultServerInfo.address, "");

		if (userOnDisk) {
			try {
				// Api is created with empty token, so we can authenticate
				const auth = await useApi
					.getState()
					.api?.authenticateUserByName(userOnDisk.Name, userOnDisk.Password);

				if (auth.status !== 200 || !auth.data.AccessToken) {
					// TODO: Proper error handling
					console.error("Authentication failed");
					return;
				}

				createApi(defaultServerInfo.address, auth.data.AccessToken);
				setInitialRoute("/home");
			} catch (error) {
				console.error(error);
				setInitialRoute("/error");
			}
		} else {
			setInitialRoute("/login/index");
		}
	} else {
		setInitialRoute("/setup/server");
	}
};
init();

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<Router>
				<App />
			</Router>
		</QueryClientProvider>
	</React.StrictMode>,
);

document.addEventListener("DOMContentLoaded", () => {
	// This will wait for the window to load, but you could
	// run this function on whatever trigger you want
	console.info("Initial render complete");
	document.querySelector(".app-loading")?.setAttribute("style", "display:none");
});
