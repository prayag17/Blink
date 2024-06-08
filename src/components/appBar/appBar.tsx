import type React from "react";
import { useEffect, useRef, useState } from "react";

import { relaunch } from "@tauri-apps/api/process";

import MuiAppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useScrollTrigger from "@mui/material/useScrollTrigger";

import { red } from "@mui/material/colors";

import {
	Link,
	useLocation,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { delServer } from "@/utils/storage/servers";
import { delUser } from "@/utils/storage/user";
import { useDrawerStore } from "@/utils/store/drawer";
import "./appBar.scss";

import { EventEmitter as event } from "@/eventEmitter";

import { getTypeIcon } from "../utils/iconsCollection";

import { useApiInContext } from "@/utils/store/api";
import useSettingsStore, {
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
	icon?: React.ReactElement;
	primary: string;
	to: string;
}

function ListItemLink(props: ListItemLinkProps) {
	const { icon, primary, to } = props;

	return (
		<li>
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

export const AppBar = () => {
	const api = useApiInContext((s) => s.api);
	const navigate = useNavigate();

	const [display, setDisplay] = useState(false);

	const location = useLocation();

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		enabled: display,
		throwOnError: true,
	});
	const libraries = useQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			const libs = await getUserViewsApi(api).getUserViews({
				userId: user.data?.Id,
			});
			return libs.data;
		},
		enabled: !!user.data && !!api.accessToken,
		networkMode: "always",
	});

	const trigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 20,
	});

	const [anchorEl, setAnchorEl] = useState(null);
	const openMenu = Boolean(anchorEl);
	const handleMenuOpen = (event) => {
		setAnchorEl(event.currentTarget);
	};
	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const queryClient = useQueryClient();

	const handleLogout = async () => {
		console.log("Logging out user...");
		await api.logout();
		delUser();
		sessionStorage.removeItem("accessToken");
		event.emit("create-jellyfin-api", api.basePath);
		queryClient.clear();
		setAnchorEl(null);
		navigate("/login/index");
	};

	useEffect(() => {
		if (
			location.pathname.includes("login") ||
			location.pathname.includes("setup") ||
			location.pathname.includes("server") ||
			location.pathname.includes("player") ||
			location.pathname.includes("error") ||
			location.pathname === "/"
		) {
			setDisplay(false);
		} else {
			setDisplay(true);
		}

	}, [location]);

	const [showDrawer, setShowDrawer] = useState(false);

	if (!display) {
		return <></>;
	}
	if (display) {
		return (
			<>
				<MuiAppBar
					style={{
						backgroundColor: "transparent",
						paddingRight: "0 !important",
					}}
					className={
						trigger
							? "appBar flex flex-row flex-justify-spaced-between elevated"
							: "appBar flex flex-row flex-justify-spaced-between"
					}
					elevation={0}
					color="transparent"
				>
					<div className="flex flex-row" style={{ gap: "0.6em" }}>
						<IconButton onClick={() => setShowDrawer(true)}>
							<div className="material-symbols-rounded">menu</div>
						</IconButton>
						<BackButton />
						<IconButton onClick={() => navigate({ to: "/home/" })}>
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
						<IconButton onClick={() => navigate({ to: "/search" })}>
							<div className="material-symbols-rounded">search</div>
						</IconButton>
						<IconButton onClick={() => navigate({ to: "/favorite" })}>
							<div className="material-symbols-rounded">favorite</div>
						</IconButton>
						<IconButton sx={{ p: 0 }} onClick={handleMenuOpen}>
							{user.isSuccess &&
								(user.data.PrimaryImageTag === undefined ? (
									<Avatar className="appBar-avatar" alt={user.data.Name}>
										<span className="material-symbols-rounded appBar-avatar-icon">
											account_circle
										</span>
									</Avatar>
								) : (
									<Avatar
										className="appBar-avatar"
										src={`${api.basePath}/Users/${user.data.Id}/Images/Primary`}
										alt={user.data.Name}
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
							sx={{ mt: 2 }}
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
					PaperProps={{
						className: "glass library-drawer",
						elevation: 6,
					}}
					className="library-drawer"
					onClose={() => setShowDrawer(false)}
				>
					<List>
						<ListItem>
							<ListItemButton
								onClick={() => setShowDrawer(false)}
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
							libraries.data.Items?.map((library, index) => (
								<ListItemLink
									key={library.Id}
									to={`/library/${library.Id}`}
									icon={getTypeIcon(library.CollectionType)}
									primary={library.Name}
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
