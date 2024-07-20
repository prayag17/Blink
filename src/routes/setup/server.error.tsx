import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import React from "react";

import "./server.error.scss";
import { Button, ButtonGroup, Typography } from "@mui/material";
import { relaunch } from "@tauri-apps/api/process";

export const Route = createFileRoute("/setup/server/error")({
	component: () => {
		const navigate = useNavigate();
		return (
			<div className="scrollY server-error-container">
				<span className="material-symbols-rounded fill gradient-text">
					report
				</span>
				<Typography variant="h4">Unable to connect to server!</Typography>
				<div className="flex flex-align-center" style={{ gap: "1em" }}>
					<Button
						variant="contained"
						onClick={() => navigate({ to: "/setup/server/list" })}
					>
						Change Server
					</Button>
					<Button
						variant="contained"
						color="secondary"
						onClick={async () => await relaunch()}
					>
						Restart Blink
					</Button>
				</div>
			</div>
		);
	},
});