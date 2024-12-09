import AppBarBackOnly from "@/components/appBar/backOnly";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import React from "react";

export const Route = createFileRoute("/_api/login")({
	beforeLoad: async ({ context, location }) => {
		if (location.pathname === "/login") {
			const api = context.api;
			if (!api) {
				console.info("Awaiting Api generation.");
				// throw redirect({ to: "/login/manual" });
			} else {
				const publicUsers = (await getUserApi(api).getPublicUsers()).data;
				if (publicUsers.length > 0) {
					throw redirect({ to: "/login/list" });
				}
				throw redirect({ to: "/login/manual" });
			}
		}
	},
	component: () => {
		return (
			<>
				<AppBarBackOnly />
				<Outlet />
			</>
		);
	},
});
