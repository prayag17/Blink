import {
	getAllServers,
	getDefaultServer,
	getServer,
} from "@/utils/storage/servers";
import { getUser } from "@/utils/storage/user";
import { axiosClient } from "@/utils/store/api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import React from "react";
import { Suspense } from "react";

export const Route = createFileRoute("/_api")({
	beforeLoad: async ({ context, location }) => {
		if (!context.api) {
			const currentServerId = await getDefaultServer();
			if (currentServerId) {
				const currentServer = await getServer(currentServerId);
				const userOnDisk = await getUser();
				if (userOnDisk) {
					context.createApi(currentServer?.address, userOnDisk.AccessToken);
				} else {
					context.createApi(currentServer?.address, undefined); // Creates Api
				}
			}
		}
	},
});