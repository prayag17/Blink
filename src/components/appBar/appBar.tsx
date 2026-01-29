import MuiAppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import { useLocation, useNavigate } from "@tanstack/react-router";
import React, { useCallback, useMemo, useState } from "react";

import "./appBar.scss";

import { useShallow } from "zustand/shallow";
// removed search placeholder; library state now managed via zustand
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import useHeaderStore from "@/utils/store/header";
import useSearchStore from "@/utils/store/search";
import BackButton from "../buttons/backButton";
import { UserAvatarMenu } from "../userAvatarMenu";
import { NavigationDrawer } from "./navigationDrawer";

const MemoizeBackButton = React.memo(BackButton);

const HIDDEN_PATHS = [
	"/login",
	"/setup",
	"/server",
	"/player",
	"/error",
	"/settings",
	"/library",
	"/search",
];

export const AppBar = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const toggleSearchDialog = useSearchStore(
		useShallow((s) => s.toggleSearchDialog),
	);

	const display = !HIDDEN_PATHS.some(
		(path) =>
			(location.pathname.startsWith(path) &&
				location.pathname !== "/player/audio") ||
			location.pathname === "/",
	);

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

	const _handleNavigateToSearch = useCallback(
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
							<span className="material-symbols-rounded">menu</span>
						</IconButton>
						<MemoizeBackButton />
						<IconButton onClick={handleNavigateToHome}>
							<span
								className={
									location.pathname === "/home"
										? "material-symbols-rounded fill"
										: "material-symbols-rounded"
								}
							>
								home
							</span>
						</IconButton>
					</div>

					<div className="flex flex-row" style={{ gap: "0.6em" }}>
						<IconButton onClick={toggleSearchDialog}>
							<span className="material-symbols-rounded">search</span>
						</IconButton>
						<IconButton onClick={handleNavigateToFavorite}>
							<span className="material-symbols-rounded">favorite</span>
						</IconButton>
						<UserAvatarMenu />
					</div>
				</MuiAppBar>
				<NavigationDrawer open={showDrawer} onClose={handleDrawerClose} />
			</>
		);
	}
};