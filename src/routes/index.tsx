import { getDefaultServer } from "@/utils/storage/servers";
import { getUser } from "@/utils/storage/user";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		console.log("Hello");
		const currentServerId = await getDefaultServer();
		const userOnDisk = await getUser();
		if (currentServerId) {
			if (userOnDisk) {
				throw redirect({ to: "/home" });
			}
			throw redirect({ to: "/login" });
		}

		throw redirect({ to: "/setup/server/add" });
	},
});