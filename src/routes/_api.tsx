import {
	getAllServers,
	getDefaultServer,
	getServer,
} from "@/utils/storage/servers";
import { getUser } from "@/utils/storage/user";
import { axiosClient, useApiInContext } from "@/utils/store/api";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import React from "react";
import { Suspense } from "react";

export const Route = createFileRoute("/_api")({
	beforeLoad: async ({ context, location }) => {
		console.log(context.api);
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
		} else if (context.api) {
			try {
				await getSystemApi(context.api).getPingSystem(); // Verify server status
			} catch (error) {
				throw redirect({
					to: "/setup/server/error",
					search: {
						redirect: location.href,
					},
				});
			}
			try {
				await getUserApi(context.api).getCurrentUser(); // Verify user is able to authenticate
			} catch (error) {
				throw redirect({
					to: "/login/manual",
					search: {
						redirect: location.href,
					},
				});
			}
		}
	},
});