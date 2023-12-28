/** @format */
import React, { useEffect, useRef, useState } from "react";

import { relaunch } from "@tauri-apps/api/process";

import MuiAppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Avatar from "@mui/material/Avatar";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import Typography from "@mui/material/Typography";
import Popper from "@mui/material/Popper";

import { red } from "@mui/material/colors";

import { useLocation, useNavigate, NavLink } from "react-router-dom";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import "./appBar.module.scss";
import { MdiAccount } from "../icons/mdiAccount";
import { MdiHeartOutline } from "../icons/mdiHeartOutline";
import { MdiArrowLeft } from "../icons/mdiArrowLeft";
import { MdiCog } from "../icons/mdiCog";
import { MdiInformation } from "../icons/mdiInformation";
import { MdiMenu } from "../icons/mdiMenu";
import { useDrawerStore } from "../../utils/store/drawer";
import { delServer } from "../../utils/storage/servers";
import { delUser } from "../../utils/storage/user";
import { MdiDelete } from "../icons/mdiDelete";

import { MdiLogoutVariant } from "../icons/mdiLogoutVariant";
import { EventEmitter as event } from "../../eventEmitter";
import { useApi } from "../../utils/store/api";

import { getTypeIcon } from "../../components/utils/iconsCollection";

import logo from "../../assets/logo.svg";

export const AppBar = () => {
	const [api] = useApi((state) => [state.api]);
	const navigate = useNavigate();

	const [display, setDisplay] = useState(false);
	const [backButtonVisible, setBackButtonVisible] = useState(false);

	const location = useLocation();

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		enabled: display,
		networkMode: "always",
	});
	let libraries = useQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			let libs = await getUserViewsApi(api).getUserViews({
				userId: user.data.Id,
			});
			return libs.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});
	useEffect(() => {
		if (user.isError) {
			console.error(user.error);
		}
	}, [user]);

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

	const [setDrawerOpen] = useDrawerStore((state) => [state.setOpen]);

	const handleDrawerOpen = () => {
		setDrawerOpen(true);
	};
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

	const [librariesPopover, setLibrariesPopover] = useState(false);
	const librariesText = useRef(null);
	const popoverEnter = (event) => {
		if (anchorEl !== event.currentTarget) {
			setLibrariesPopover(event.currentTarget);
		}
	};

	const popoverLeave = () => {
		setLibrariesPopover(null);
	};

	const [isBrowsingLibrary, setIsBrowsingLibrary] = useState(false);

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

		if (location.pathname == "/home") {
			setBackButtonVisible(false);
		} else {
			setBackButtonVisible(true);
		}

		if (location.pathname.includes("library")) {
			setIsBrowsingLibrary(true);
		} else {
			setIsBrowsingLibrary(false);
		}
	}, [location]);

	if (!display) {
		return <></>;
	}
	if (display) {
		return (
			<MuiAppBar
				style={{
					backgroundColor: "transparent",
					paddingRight: "0 !important",
				}}
				className={trigger ? "appBar backdropVisible" : "appBar"}
				elevation={0}
			>
				<Toolbar
					sx={{
						display: "grid",
						gap: "0.6em",
						gridTemplateColumns: "30% 1fr 30%",
					}}
				>
					<div
						className="flex flex-row flex-center"
						style={{
							gap: "1.2em",
							justifySelf: "start",
						}}
					>
						<IconButton
							onClick={() => navigate(-1)}
							disabled={!backButtonVisible}
							style={{
								justifySelf: "left",
							}}
						>
							<div className="material-symbols-rounded">
								arrow_back
							</div>
						</IconButton>
						<img src={logo} className="appBar-logo" />
					</div>

					<div
						className="flex flex-row flex-center"
						style={{
							gap: "2.6em",
						}}
					>
						<NavLink to="/home" className="appBar-text">
							<Typography variant="subtitle1">
								Home
							</Typography>
						</NavLink>
						<Typography
							ref={librariesText}
							variant="subtitle1"
							className={
								isBrowsingLibrary
									? "appBar-text active"
									: "appBar-text"
							}
							onMouseEnter={popoverEnter}
							// onMouseLeave={popoverLeave}
						>
							Libraries
						</Typography>
						<Menu
							open={Boolean(librariesPopover)}
							anchorEl={librariesPopover}
							// anchorOrigin={{
							// 	vertical: "bottom",
							// 	horizontal: "right",
							// }}
							// transformOrigin={{
							// 	vertical: "top",
							// 	horizontal: "left",
							// }}
							// slotProps={{
							// 	paper: {
							// 		onMouseEnter: popoverEnter,
							// 		onMouseLeave: popoverLeave,
							// 	},
							// }}
							anchorOrigin={{
								horizontal: "center",
								vertical: "bottom",
							}}
							transformOrigin={{
								horizontal: "center",
								vertical: "top",
							}}
							sx={{
								mt: 3,
								maxHeight: "72em",
							}}
							onClose={popoverLeave}
							MenuListProps={{
								onMouseLeave: popoverLeave,
							}}
							disableScrollLock
						>
							{libraries.isPending
								? "loading..."
								: libraries.data.Items.map(
										(library) => (
											<MenuItem
												key={library.Id}
												onClick={() =>
													navigate(
														`/library/${library.Id}`,
													)
												}
											>
												<ListItemIcon>
													{getTypeIcon(
														library.CollectionType,
													)}
												</ListItemIcon>
												{library.Name}
											</MenuItem>
										),
								  )}
						</Menu>
					</div>

					<div
						className="flex flex-row"
						style={{ justifySelf: "right", gap: "0.6em" }}
					>
						<IconButton onClick={() => navigate("/search")}>
							<div className="material-symbols-rounded">
								search
							</div>
						</IconButton>
						<IconButton onClick={() => navigate("/favorite")}>
							<div className="material-symbols-rounded">
								favorite
							</div>
						</IconButton>
						<IconButton
							sx={{ p: 0 }}
							onClick={handleMenuOpen}
						>
							{user.isSuccess &&
								(user.data.PrimaryImageTag ==
								undefined ? (
									<Avatar
										className="appBar-avatar"
										alt={user.data.Name}
									>
										<MdiAccount className="appBar-avatar-icon" />
									</Avatar>
								) : (
									<Avatar
										className="appBar-avatar"
										src={
											api.basePath +
											"/Users/" +
											user.data.Id +
											"/Images/Primary"
										}
										alt={user.data.Name}
									>
										<MdiAccount className="appBar-avatar-icon" />
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
								onClick={() => navigate("/settings")}
								disabled
							>
								<ListItemIcon>
									<div className="material-symbols-rounded">
										settings
									</div>
								</ListItemIcon>
								Settings
							</MenuItem>
							<MenuItem onClick={() => navigate("/about")}>
								<ListItemIcon>
									<div className="material-symbols-rounded">
										info
									</div>
								</ListItemIcon>
								About
							</MenuItem>
							<MenuItem onClick={handleLogout}>
								<ListItemIcon>
									<div className="material-symbols-rounded">
										logout
									</div>
								</ListItemIcon>
								Logout
							</MenuItem>
							<MenuItem
								onClick={async () => {
									navigate("/servers/list");
								}}
							>
								<ListItemIcon>
									<div className="material-symbols-rounded appBar-icon">
										dns
									</div>
								</ListItemIcon>
								Select Server
							</MenuItem>
						</Menu>
					</div>
				</Toolbar>
			</MuiAppBar>
		);
	}
};
