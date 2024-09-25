import { getDefaultServer } from "@/utils/storage/servers";
import { getUser } from "@/utils/storage/user";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import React from "react";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
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