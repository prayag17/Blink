import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { CircularProgress, Typography } from "@mui/material";
import { createFileRoute, redirect } from "@tanstack/react-router";
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
	// component: () => {
	// 	const data = Route.useRouteContext();
	// 	console.log(data);
	// 	return (
	// 		<div style={{ height: "100vh" }} className="flex flex-column flex-center">
	// 			<CircularProgress size={86} thickness={2} />
	// 			<Typography mt={4} align="center">
	// 				Fetching users...
	// 			</Typography>
	// 		</div>
	// 	);
	// },
});
