import {
	type ServerInfo,
	getAllServers,
	getDefaultServer,
	getServer,
} from "@/utils/storage/servers";
import { UserStore, delUser, getUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";
import { setAppReady, useCentralStore } from "@/utils/store/central";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import {
	Button,
	ButtonGroup,
	CircularProgress,
	Typography,
} from "@mui/material";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type LoaderData = {
	serversOnDisk: ServerInfo[];
	currentServer: ServerInfo | undefined;
	userOnDisk: { Name: string; AccessToken: string } | null;
};

export const Route = createFileRoute("/")({
	component: Index,
	errorComponent: (error) => {
		console.error(error.error);
	},
	beforeLoad: async ({ context, navigate }) => {
		const api = context.api;
		const serversOnDisk = await getAllServers();
		const currentServerId = await getDefaultServer();
		const currentServer = await getServer(currentServerId);
		const userOnDisk = await getUser();
		const createApi = context.createApi;

		if (serversOnDisk.length > 0) {
			if (currentServer) {
				// setStatus(
				// 	`Server found!
				// 	Checking server status...`,
				// );
				// setIsError(false);
				const pingServer = async () => {
					const result = (
						await axios.get(`${currentServer.address}/System/Ping`)
					).data;
					return result === "Jellyfin Server";
				};
				pingServer()
					.then(async (isOnline) => {
						if (isOnline) {
							// setStatus("Server online!");
							// setIsError(false);

							createApi(currentServer.address, undefined);

							if (userOnDisk) {
								// setStatus(
								// 	`User found!
								// 	Trying to authenticate user...`,
								// );

								createApi(currentServer.address, userOnDisk.AccessToken);

								// const api = useApiInContext((s) => s.api);
								try {
									console.log();
									await getUserApi(api).getCurrentUser();
								} catch (err) {
									console.error(err);
									// setStatus("Unable to authenticate.");
									// setIsError(true);
									// setIsAuthError(true);
								}
							} else {
								navigate({ to: "/login" });
							}
						} else {
							// setStatus("Unable to reach server");
							// setIsError(false);
						}
					})
					.catch((error) => {
						// setStatus("Unable to reach server");
						// setIsError(true);
						console.error(error);
					});
			} else {
				// setStatus("No server found.");
				// setIsError(false);
				navigate({ to: "/setup/server/list" });
			}
		}
	},
});

function Index() {
	return <h1>Loading...</h1>;
}
