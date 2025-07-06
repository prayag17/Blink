import { Fab, Link, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import blinkLogo from "@/assets/logoBlackTransparent.png";
import { version } from "../../../../package.json";

import "./about.scss";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	getSystemInfoQueryOptions,
	getUpdateQueryOptions,
} from "@/utils/queries/about";
import { useApiInContext } from "@/utils/store/api";

export const Route = createFileRoute("/_api/settings/about")({
	component: RouteComponent,
	loader: async ({ context: { queryClient, api } }) => {
		await queryClient.ensureQueryData(getSystemInfoQueryOptions(api));
		await queryClient.ensureQueryData(getUpdateQueryOptions);
	},
});

function RouteComponent() {
	const api = useApiInContext((s) => s.api);
	const systemInfo = useSuspenseQuery(getSystemInfoQueryOptions(api));
	const updateInfo = useSuspenseQuery(getUpdateQueryOptions);

	return (
		<div className="settings-page-scrollY settings-about-container">
			{/* <Typography variant="h4">About</Typography> */}
			<img src={blinkLogo} alt="Blink" className="settings-about-logo" />
			<Typography sx={{ opacity: 0.8, marginTop: "-4em" }}>
				v{version}
			</Typography>
			<div className="settings-about-table">
				<div className="settings-about-table-row">
					<Typography variant="subtitle1">Server Name</Typography>
					<Typography variant="subtitle1">
						{systemInfo.data.ServerName}
					</Typography>
				</div>
				<div className="settings-about-table-row">
					<Typography variant="subtitle1">Jellyfin Version</Typography>
					<Typography variant="subtitle1">{systemInfo.data.Version}</Typography>
				</div>
				<div className="settings-about-table-row">
					<Typography variant="subtitle1">Update Available</Typography>
					<Typography variant="subtitle1">
						{updateInfo.data
							? `v${updateInfo.data.version}`
							: "No update available."}
					</Typography>
				</div>
			</div>
			<div className="settings-about-links">
				<Typography variant="h6" style={{ marginBottom: "0.5em" }}>
					Links
				</Typography>
				<Link href="https://github.com/prayag17/Blink">
					https://github.com/prayag17/Blink
				</Link>
				<Link href="https://jellyfin.org">https://jellyfin.org</Link>
			</div>
			<Fab
				LinkComponent={Link}
				href="https://github.com/sponsors/prayag17"
				variant="extended"
				target="_blank"
				color="primary"
				sx={{
					position: "fixed",
					bottom: "2em",
					right: "2em",
				}}
			>
				<span
					className="material-symbols-rounded fill"
					style={{
						marginRight: "0.25em",
					}}
				>
					volunteer_activism
				</span>
				Support
			</Fab>
		</div>
	);
}
