/** @format */
import React, { useEffect, useState } from "react";

import { relaunch } from "@tauri-apps/api/process";

import MuiAppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Avatar from "@mui/material/Avatar";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import useScrollTrigger from "@mui/material/useScrollTrigger";

import { MdiMagnify } from "../icons/mdiMagnify";

import { useLocation, useNavigate } from "react-router-dom";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
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
		enabled: display && Boolean(api),
		networkMode: "always",
	});
	useEffect(() => {
		if (user.isError) {
			console.log(api);
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

	useEffect(() => {
		if (location.pathname == "/home") {
			setBackButtonVisible(false);
		} else {
			setBackButtonVisible(true);
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
						justifyContent: "space-between",
						paddingLeft: "20px !important",
					}}
				>
					<div
						style={{
							display: "flex",
							gap: "1em",
							alignItems: "center",
						}}
					>
						<IconButton
							color="inherit"
							aria-label="open drawer"
							onClick={handleDrawerOpen}
						>
							<MdiMenu />
						</IconButton>
						<IconButton
							onClick={() => navigate(-1)}
							sx={{
								transition: "transform 0.2s",
								transform: backButtonVisible
									? "scale(1)"
									: "scale(0)",
								transformOrigin: "left",
								ml: 2,
							}}
						>
							<MdiArrowLeft />
						</IconButton>
					</div>
					<div style={{ display: "flex", gap: "1.2em" }}>
						<IconButton onClick={() => navigate("/search")}>
							<MdiMagnify />
						</IconButton>
						<IconButton onClick={() => navigate("/favorite")}>
							<MdiHeartOutline />
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
							sx={{ mt: 1 }}
							disableScrollLock
						>
							<MenuItem
								onClick={() => navigate("/settings")}
								disabled
							>
								<ListItemIcon>
									<MdiCog />
								</ListItemIcon>
								Settings
							</MenuItem>
							<MenuItem
								onClick={() => navigate("/about")}
								disabled
							>
								<ListItemIcon>
									<MdiInformation />
								</ListItemIcon>
								About
							</MenuItem>
							<MenuItem onClick={handleLogout}>
								<ListItemIcon>
									<MdiLogoutVariant />
								</ListItemIcon>
								Logout
							</MenuItem>
							<MenuItem
								onClick={async () => {
									await delServer();
									await delUser();
									await relaunch();
								}}
							>
								<ListItemIcon>
									<MdiDelete />
								</ListItemIcon>
								Remove Server
							</MenuItem>
						</Menu>
					</div>
				</Toolbar>
			</MuiAppBar>
		);
	}
};
