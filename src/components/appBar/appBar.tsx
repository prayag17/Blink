import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import MuiAppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import { useQuery } from "@tanstack/react-query";

import { useLocation, useNavigate } from "@tanstack/react-router";
import React, { useCallback, useMemo, useState } from "react";

import "./appBar.scss";

import { Divider, Drawer, List, ListItem, ListItemButton } from "@mui/material";
import { useShallow } from "zustand/shallow";
// removed search placeholder; library state now managed via zustand
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import useHeaderStore from "@/utils/store/header";
import {
	setSettingsDialogOpen,
	setSettingsTabValue,
} from "@/utils/store/settings";
import BackButton from "../buttons/backButton";
import ListItemLink from "../listItemLink";
import { UserAvatarMenu } from "../userAvatarMenu";
import { getTypeIcon } from "../utils/iconsCollection";

const MemoizeBackButton = React.memo(BackButton);

const HIDDEN_PATHS = [
	"/login",
	"/setup",
	"/server",
	"/player",
	"/error",
	"/settings",
	"/library",
];

export const AppBar = () => {
	const api = useApiInContext((s) => s.api);

	const navigate = useNavigate();
	const location = useLocation();

	const display = !HIDDEN_PATHS.some(
		(path) =>
			(location.pathname.startsWith(path) &&
				location.pathname !== "/player/audio") ||
			location.pathname === "/",
	);


	const [user] = useCentralStore((s) => [s.currentUser]);
	const libraries = useQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			if (!user?.Id || !api?.accessToken) {
				return;
			}
			const libs = await getUserViewsApi(api).getUserViews({
				userId: user.Id,
			});
			return libs.data;
		},
		enabled: !!user?.Id && !!api?.accessToken,
		networkMode: "always",
	});

	const trigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 20,
	});

	const [showDrawer, setShowDrawer] = useState(false);

	const appBarStyling = useMemo(() => {
		return {
			backgroundColor: "transparent",
			paddingRight: "0 !important",
		};
	}, []);

	const drawerPaperProps = useMemo(() => {
		return {
			className: "glass library-drawer",
			elevation: 6,
		};
	}, []);

	const handleNavigateToSearch = useCallback(
		() => navigate({ to: "/search", search: { query: "" } }),
		[navigate],
	);

	const handleDrawerClose = useCallback(() => {
		setShowDrawer(false);
	}, []);

	const handleDrawerOpen = useCallback(() => {
		setShowDrawer(true);
	}, []);

	const handleNavigateToHome = useCallback(() => navigate({ to: "/home" }), []);
	const handleNavigateToFavorite = useCallback(() => {
		navigate({ to: "/favorite" });
	}, []);

	useHeaderStore(useShallow((s) => ({ pageTitle: s.pageTitle })));

	if (!display) {
		return null;
	}
	if (display) {
		return (
			<>
				<MuiAppBar
					style={appBarStyling}
					className={
						trigger
							? "appBar flex flex-row flex-justify-spaced-between elevated"
							: "appBar flex flex-row flex-justify-spaced-between"
					}
					elevation={0}
					color="transparent"
				>
					<div className="flex flex-row" style={{ gap: "0.6em" }}>
						<IconButton onClick={handleDrawerOpen}>
							<div className="material-symbols-rounded">menu</div>
						</IconButton>
						<MemoizeBackButton />
						<IconButton onClick={handleNavigateToHome}>
							<div
								className={
									location.pathname === "/home"
										? "material-symbols-rounded fill"
										: "material-symbols-rounded"
								}
							>
								home
							</div>
						</IconButton>
					</div>

					<div className="flex flex-row" style={{ gap: "0.6em" }}>
						<IconButton onClick={handleNavigateToSearch}>
							<div className="material-symbols-rounded">search</div>
						</IconButton>
						<IconButton onClick={handleNavigateToFavorite}>
							<div className="material-symbols-rounded">favorite</div>
						</IconButton>
						<UserAvatarMenu />
					</div>
				</MuiAppBar>
				<Drawer
					open={showDrawer}
					slotProps={{ paper: drawerPaperProps }}
					className="library-drawer"
					onClose={handleDrawerClose}
				>
					<List>
						<ListItem>
							<ListItemButton
								onClick={handleDrawerClose}
								style={{
									borderRadius: "100px",
									gap: "0.85em",
								}}
							>
								<span className="material-symbols-rounded">menu_open</span>
								Close
							</ListItemButton>
						</ListItem>
					</List>
					<Divider variant="middle" />
					<List>
						<ListItemLink
							className="library-drawer-item"
							to="/home"
							icon="home"
							primary="Home"
						/>
						{libraries.isSuccess &&
							libraries.data?.Items?.map((library) => (
								<ListItemLink
									className="library-drawer-item"
									key={library.Id}
									to="/library/$id"
									params={{ id: library.Id ?? "" }}
									icon={
										library.CollectionType &&
										getTypeIcon(library.CollectionType)
									}
									primary={library.Name ?? "Library"}
								/>
							))}
					</List>
					<Divider variant="middle" />
					<List>
						<ListItem>
							<ListItemButton
								onClick={() => {
									setSettingsDialogOpen(true);
									setSettingsTabValue(1);
								}}
								style={{
									borderRadius: "100px",
									gap: "0.85em",
								}}
							>
								<span className="material-symbols-rounded">settings</span>
								Settings
							</ListItemButton>
						</ListItem>
						<ListItem>
							<ListItemButton
								onClick={() => {
									setSettingsDialogOpen(true);
									setSettingsTabValue(2);
								}}
								style={{
									borderRadius: "100px",
									gap: "0.85em",
								}}
							>
								<span className="material-symbols-rounded">dns</span>
								Change Server
							</ListItemButton>
						</ListItem>
						<ListItem>
							<ListItemButton
								onClick={() => {
									setSettingsDialogOpen(true);
									setSettingsTabValue(10);
								}}
								style={{
									borderRadius: "100px",
									gap: "0.85em",
								}}
							>
								<span className="material-symbols-rounded">info</span>
								About
							</ListItemButton>
						</ListItem>
					</List>
				</Drawer>
			</>
		);
	}
};
