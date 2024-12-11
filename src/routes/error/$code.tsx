import { Button, Typography } from "@mui/material";
import { Link, createFileRoute } from "@tanstack/react-router";
import { relaunch } from "@tauri-apps/plugin-process";
import React from "react";

export const Route = createFileRoute("/error/$code")({
	component: ErrorRoute,
});

function ErrorRoute() {
	const errorCode = Route.useParams({ select: (s) => s.code });
	switch (errorCode) {
		case "101":
			return (
				<div
					className="flex flex-column flex-center"
					style={{ height: "100vh", gap: "0.25em" }}
				>
					<span
						className="material-symbols-rounded fill gradient-text"
						style={{ fontSize: "8em", marginBottom: "0.0em" }}
					>
						report
					</span>
					<Typography variant="h5" fontWeight={500}>
						Error connecting server.
					</Typography>
					<Typography variant="subtitle2" style={{ opacity: 0.6 }}>
						Check your internet connection or contact your server administrator
					</Typography>
					<div
						className="flex flex-center"
						style={{ gap: "1em", marginTop: "0.5em" }}
					>
						<Button
							component={Link}
							to="/setup/server/list"
							variant="contained"
						>
							Change Server
						</Button>
						<Button variant="contained" onClick={async () => await relaunch()}>
							Restart Blink
						</Button>
					</div>
				</div>
			);

		default:
			return <div>Error</div>;
	}
} 