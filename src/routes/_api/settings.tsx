import { useBackdropStore } from "@/utils/store/backdrop";
import {
	Link,
	Outlet,
	createFileRoute,
	useNavigate,
} from "@tanstack/react-router";
import React, { useCallback, useEffect } from "react";

import "./settings.scss";
import BackButton from "@/components/buttons/backButton";
import ListItemLink from "@/components/listItemLink";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { Button, Divider, IconButton, List, Typography } from "@mui/material";

export const Route = createFileRoute("/_api/settings")({
	component: SettingsRoute,
});

function SettingsRoute() {
	const setBackdrop = useBackdropStore((s) => s.setBackdrop);
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	useEffect(() => {
		setBackdrop("", "none");
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
					<IconButton onClick={handleNavigateHome}>
						<span className="material-symbols-rounded">home</span>
					</IconButton>
				</div>
				<Divider flexItem />
				<div className="settings-sidebar-header">
					<img
						className="settings-sidebar-header-image"
						src={`${api?.basePath}/Users/${user?.Id}/Images/Primary`}
						alt="user"
					/>
					<div className="flex flex-column">
						<Typography variant="h6">{user?.Name}</Typography>
						<Typography variant="caption" style={{ opacity: 0.5 }}>
							{user?.Policy?.IsAdministrator ? "administrator" : "user"}
						</Typography>
					</div>
				</div>
				<Divider flexItem variant="middle" />
				<List
					component="nav"
					aria-label="main mailbox folders"
					className="settings-sidebar-list"
					style={{
						width: "100%",
					}}
				>
					<ListItemLink
						to="/settings/preferences"
						icon="tune"
						primary="Preferences"
						className="settings-sidebar-list-item"
					/>
				</List>
			</div>
			<Outlet />
		</div>
	);
}
