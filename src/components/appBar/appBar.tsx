import React, {
	type MouseEventHandler,
	useCallback,
	useMemo,
	type ReactNode,
} from "react";
import { useEffect, useState } from "react";

import MuiAppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import useScrollTrigger from "@mui/material/useScrollTrigger";

import {
	Link,
	useLocation,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";

import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { delUser } from "@/utils/storage/user";
import "./appBar.scss";

import { getTypeIcon } from "../utils/iconsCollection";

import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import {
	setSettingsDialogOpen,
	setSettingsTabValue,
} from "@/utils/store/settings";
import {
	Divider,
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
} from "@mui/material";
import BackButton from "../buttons/backButton";

interface ListItemLinkProps {
	icon?: ReactNode;
	primary: string;
	to: string;
}

function ListItemLink(props: ListItemLinkProps) {
	const { icon, primary, to } = props;

	return (
		<li>
			{/* @ts-ignore */}
			<ListItem
				component={Link}
				activeClassName="active"
				className="library-drawer-item"
				to={to}
			>
				<ListItemButton
					style={{
						borderRadius: "100px",
						gap: "0.85em",
						color: "white",
						textDecoration: "none",
					}}
				>
					<div className="material-symbols-rounded">{icon}</div>
					<ListItemText primary={primary} />
				</ListItemButton>
			</ListItem>
		</li>
	);
}

const MemoizeBackButton = React.memo(BackButton);

export const AppBar = () => {
	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);

	const navigate = useNavigate();

	const [display, setDisplay] = useState(false);

	const location = useLocation();
	const router = useRouter();

	const [user, resetCurrentUser] = useCentralStore((s) => [
		s.currentUser,
		s.resetCurrentUser,
	]);
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

	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
	const openMenu = Boolean(anchorEl);
	const handleMenuOpen: MouseEventHandler<HTMLButtonElement> = useCallback(
		(event) => {
			setAnchorEl(event.currentTarget);
		},
		[],
	);
	const handleMenuClose = useCallback(() => {
		setAnchorEl(null);
	}, []);
	const queryClient = useQueryClient();

	const handleLogout = async () => {
		console.log("Logging out user...");
		await api?.logout();
		createApi(api?.basePath ?? "", undefined);
		console.log(api);
		resetCurrentUser();
		delUser();
		sessionStorage.removeItem("accessToken");
		await router.invalidate();
		queryClient.clear();
		setAnchorEl(null);
		navigate({ to: "/login" });
	};

	useEffect(() => {
		if (
			location.pathname.includes("login") ||
			location.pathname.includes("setup") ||
			location.pathname.includes("server") ||
			location.pathname === "/player" ||
			location.pathname.includes("error") ||
			location.pathname === "/"
		) {
			setDisplay(false);
		} else {
			setDisplay(true);
		}
	}, [location]);

	const [showDrawer, setShowDrawer] = useState(false);

	const appBarStyling = useMemo(() => {
		return {
			backgroundColor: "transparent",
			paddingRight: "0 !important",
		};
	}, []);
	const menuStyle = useMemo(() => {
		return { mt: 2 };
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

	const menuButtonSx = useMemo(() => ({ p: 0 }), []);

	if (!display) {
		return <></>;
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
						<IconButton sx={menuButtonSx} onClick={handleMenuOpen}>
							{!!user?.Id &&
								(user?.PrimaryImageTag === undefined ? (
									<Avatar className="appBar-avatar" alt={user?.Name ?? "image"}>
										<span className="material-symbols-rounded appBar-avatar-icon">
											account_circle
										</span>
									</Avatar>
								) : (
									<Avatar
										className="appBar-avatar"
										src={`${api?.basePath}/Users/${user?.Id}/Images/Primary`}
										alt={user?.Name ?? "image"}
									>
										<span className="material-symbols-rounded appBar-avatar-icon">
											account_circle
										</span>
									</Avatar>
								))}
						</IconButton>
						<Menu
							anchorEl={anchorEl}
							open={openMenu}
							onClose={handleMenuClose}
							sx={menuStyle}
							disableScrollLock
						>
							<MenuItem
								onClick={() => {
									handleLogout();
									handleMenuClose();
								}}
							>
								<ListItemIcon>
									<div className="material-symbols-rounded">logout</div>
								</ListItemIcon>
								Logout
							</MenuItem>
							<Divider />
							<MenuItem
								onClick={() => {
									setSettingsDialogOpen(true);
									setSettingsTabValue(1);
									handleMenuClose();
								}}
							>
								<ListItemIcon>
									<div className="material-symbols-rounded">settings</div>
								</ListItemIcon>
								Settings
							</MenuItem>
							<MenuItem
								onClick={() => {
									setSettingsDialogOpen(true);
									setSettingsTabValue(10);
									handleMenuClose();
								}}
							>
								<ListItemIcon>
									<div className="material-symbols-rounded">info</div>
								</ListItemIcon>
								About
							</MenuItem>
						</Menu>
					</div>
				</MuiAppBar>
				<Drawer
					open={showDrawer}
					PaperProps={drawerPaperProps}
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
						<ListItemLink to="/home" icon="home" primary="Home" />
						{libraries.isSuccess &&
							libraries.data?.Items?.map((library) => (
								<ListItemLink
									key={library.Id}
									to={`/library/${library.Id}`}
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
