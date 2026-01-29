import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import React, { useCallback, useEffect } from "react";
import { useBackdropStore } from "@/utils/store/backdrop";

import "./settings.scss";
import { Divider, IconButton, List, Typography } from "@mui/material";
import { useShallow } from "zustand/shallow";
import BackButton from "@/components/buttons/backButton";
import ListItemLink from "@/components/listItemLink";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";

export const Route = createFileRoute("/_api/settings")({
	component: SettingsRoute,
});

function SettingsRoute() {
	const setBackdrop = useBackdropStore(useShallow((s) => s.setBackdrop));
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	useEffect(() => {
		setBackdrop("");
	});
	const navigate = useNavigate();
	const handleNavigateHome = useCallback(() => {
		navigate({ to: "/home" });
	}, []);
	return (
		<div className="settings-page-container">
			<div className="settings-sidebar">
				<div className="settings-sidebar-controls">
					<BackButton />
					<IconButton
						onClick={handleNavigateHome}
						sx={{
							background: "rgba(255, 255, 255, 0.05)",
							"&:hover": { background: "rgba(255, 255, 255, 0.1)" },
						}}
					>
						<span className="material-symbols-rounded">home</span>
					</IconButton>
				</div>

				<div className="settings-sidebar-header">
					<img
						className="settings-sidebar-header-image"
						src={`${api?.basePath}/Users/${user?.Id}/Images/Primary`}
						alt="user"
					/>
					<div className="flex flex-column">
						<Typography variant="h6" fontWeight="bold">
							{user?.Name}
						</Typography>
						<Typography variant="body2" sx={{ opacity: 0.5 }}>
							{user?.Policy?.IsAdministrator ? "Administrator" : "User"}
						</Typography>
					</div>
				</div>

				<List
					component="nav"
					aria-label="settings navigation"
					className="settings-sidebar-list"
					sx={{
						width: "100%",
						padding: 0,
					}}
				>
					<Typography
						variant="overline"
						sx={{
							px: 2,
							py: 1,
							opacity: 0.5,
							fontWeight: "bold",
							letterSpacing: "0.1em",
						}}
					>
						General
					</Typography>
					<ListItemLink
						to="/settings/preferences"
						icon="tune"
						primary="Preferences"
						className="settings-sidebar-list-item"
					/>
					<ListItemLink
						to="/settings/changeServer"
						icon="dns"
						primary="Servers"
						className="settings-sidebar-list-item"
					/>

					<Typography
						variant="overline"
						sx={{
							px: 2,
							py: 1,
							mt: 2,
							opacity: 0.5,
							fontWeight: "bold",
							letterSpacing: "0.1em",
						}}
					>
						System
					</Typography>
					<ListItemLink
						to="/settings/about"
						icon="info"
						primary="About"
						className="settings-sidebar-list-item"
					/>
				</List>
			</div>
			<Outlet />
		</div>
	);
}
