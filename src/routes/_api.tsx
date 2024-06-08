import { getDefaultServer, getServer } from "@/utils/storage/servers";
import { getUser } from "@/utils/storage/user";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_api")({
	beforeLoad: async ({ context }) => {
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
			if (context.api.accessToken) {
				try {
					await getUserApi(context.api).getCurrentUser(); // Verify user is able to authenticate
				} catch (error) {
					console.error(error);
					throw redirect({
						to: "/login/manual",
						search: {
							redirect: location.href,
						},
					});
				}
			}
		}
	},
});