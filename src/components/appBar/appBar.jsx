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
import Button from "@mui/material/Button";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import Grow from "@mui/material/Grow";

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

import logo from "../../assets/icon.svg";

const forwardRefNavLink = React.forwardRef({
	displayName: "NavLink",
	render: (props, ref) => (
		<NavLink
			ref={ref}
			to={props.to}
			className={({ isActive }) =>
				`${props.className} ${
					isActive ? props.activeClassName : ""
				}`
			}
		>
			{props.children}
		</NavLink>
	),
});

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

	const [librariesPopper, setLibrariesPopper] = useState(false);
	const librariesText = useRef(null);

	const handlePopper = (event) => {
		if (librariesPopper) {
			setLibrariesPopper(null);
		} else {
			setLibrariesPopper(event.currentTarget);
		}
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
				elevation={trigger ? 4 : 0}
				color="transparent"
			>
				<Toolbar
					sx={{
						display: "grid",
						gap: "0.6em",
						gridTemplateColumns: "30% 1fr 30%",
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

					<div
						className="flex flex-row flex-center"
						style={{
							gap: "2.6em",
						}}
					>
						<NavLink to="/home">
							{({ isActive }) =>
								isActive ? (
									<Button
										style={{
											textTransform: "none",
										}}
										size="large"
										className="appBar-text active"
									>
										<Typography
											variant="subtitle1"
											fontWeight={600}
										>
											Home
										</Typography>
									</Button>
								) : (
									<Button
										style={{
											textTransform: "none",
										}}
										className="appBar-text"
										size="large"
										color="white"
									>
										<Typography
											variant="subtitle1"
											fontWeight={600}
										>
											Home
										</Typography>
									</Button>
								)
							}
						</NavLink>
						<Button
							variant="text"
							// disableRipple
							disableElevation
							onClick={handlePopper}
							style={{ textTransform: "none" }}
							size="large"
							disableFocusRipple={false}
							color={
								isBrowsingLibrary ? "primary" : "white"
							}
							className={
								isBrowsingLibrary
									? "appBar-text active"
									: "appBar-text"
							}
						>
							<Typography
								variant="subtitle1"
								fontWeight={600}
							>
								Libraries
							</Typography>
						</Button>
						{/* <Typography
							variant="subtitle1"
							fontWeight={600}
							onMouseEnter={popoverEnter}
							onFocus={popoverEnter}
							tabIndex={0}
							className={
								isBrowsingLibrary
									? "appBar-text active"
									: "appBar-text"
							}
							// onMouseLeave={popoverLeave}
						></Typography> */}

						<Popper
							open={Boolean(librariesPopper)}
							anchorEl={librariesPopper}
							placement="bottom"
							disablePortal
							modifiers={[
								{
									name: "flip",
									enabled: true,
									options: {
										altBoundary: true,
										rootBoundary: "document",
										padding: 8,
									},
								},
								{
									name: "preventOverflow",
									enabled: true,
									options: {
										altAxis: true,
										altBoundary: true,
										tether: true,
										rootBoundary: "document",
										padding: 8,
									},
								},
							]}
							transition
						>
							{({ TransitionProps }) => (
								<Grow
									{...TransitionProps}
									style={{
										transformOrigin: "50% 0 0",
									}}
									timeout={250}
								>
									<Paper
										sx={{
											mt: "1.1em",
											maxHeight: "72em",
										}}
										style={{
											boxShadow:
												"0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)",
											overflow: "hidden",
											borderRadius: "25px",
										}}
									>
										<div className="appBar-library-scrollContainer">
											{libraries.isPending
												? "loading..."
												: libraries.data.Items.map(
														(
															library,
														) => (
															<NavLink
																key={
																	library.Id
																}
																className="appBar-library"
																to={`library/${library.Id}`}
																style={{
																	borderRadius:
																		"10px",
																}}
															>
																{Object.keys(
																	library.ImageTags,
																).includes(
																	"Primary",
																) ? (
																	<img
																		src={`${api.basePath}/Items/${library.Id}/Images/Primary?quality=90&fillHeight=226&fillWidth=127`}
																	/>
																) : (
																	<div className="appBar-library-icon">
																		{" "}
																		{getTypeIcon(
																			library.CollectionType,
																		)}{" "}
																		<Typography variant="h6">
																			{
																				library.Name
																			}
																		</Typography>
																	</div>
																)}
															</NavLink>
														),
												  )}
										</div>
									</Paper>
								</Grow>
							)}
						</Popper>
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
