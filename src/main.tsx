import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import {
	delServer,
	getAllServers,
	getDefaultServer,
	getServer,
	setDefaultServer,
} from "./utils/storage/servers";
import { UserStore, delUser, getUser } from "./utils/storage/user";
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
	console.log(defaultServerOnDisk);

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

init().then(() => {
	ReactDOM.createRoot(document.getElementById("root")!).render(
		<React.StrictMode>
			<QueryClientProvider client={queryClient}>
				<Router>
					<App />
				</Router>
			</QueryClientProvider>
		</React.StrictMode>,
	);

	document.querySelector(".app-loading")!.setAttribute("style", "display:none");
});
