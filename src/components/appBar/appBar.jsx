/** @format */
import { useEffect, useState } from "react";

import MuiAppBar from "@mui/material/AppBar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import useScrollTrigger from "@mui/material/useScrollTrigger";

import { MdiMagnify } from "../icons/mdiMagnify";
import { theme } from "../../theme";

import { useLocation, useNavigate } from "react-router-dom";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { useQuery } from "@tanstack/react-query";

import "./appBar.module.scss";
import { MdiAccount } from "../icons/mdiAccount";
import { MdiHeartOutline } from "../icons/mdiHeartOutline";
import { MdiArrowLeft } from "../icons/mdiArrowLeft";
import { MdiCog } from "../icons/mdiCog";
import { MdiInformation } from "../icons/mdiInformation";
import { MdiMenu } from "../icons/mdiMenu";

export const AppBar = () => {
	const navigate = useNavigate();

	const [display, setDisplay] = useState(false);
	const [backButtonVisible, setBackButtonVisible] = useState(false);

	const location = useLocation();

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		enabled: display,
		networkMode: "always",
	});

	const trigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 0,
	});

	const [anchorEl, setAnchorEl] = useState(null);
	const openMenu = Boolean(anchorEl);
	const handleMenuOpen = (event) => {
		setAnchorEl(event.currentTarget);
	};
	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	useEffect(() => {
		if (
			location.pathname.includes("login") ||
			location.pathname.includes("setup") ||
			location.pathname.includes("player") ||
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
				sx={{
					backgroundColor: "transparent",
					paddingRight: "0 !important",
				}}
				className={trigger ? "appBar backdropVisible" : "appBar"}
				elevation={0}
			>
				<Toolbar
					sx={{
						justifyContent: "space-between",
						paddingLeft: "12px !important",
					}}
				>
					<Box
						sx={{
							display: "flex",
							gap: 1,
							alignItems: "center",
						}}
					>
						<IconButton
							color="inherit"
							aria-label="open drawer"
							// onClick={handleDrawerOpen}
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

						<TextField
							variant="outlined"
							placeholder="Search..."
							size="small"
						/>
						<IconButton>
							<MdiMagnify />
						</IconButton>
					</Box>
					<Box sx={{ display: "flex", gap: 2 }}>
						<IconButton>
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
											window.api.basePath +
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
						>
							<MenuItem
								onClick={() => navigate("/settings")}
							>
								<ListItemIcon>
									<MdiCog />
								</ListItemIcon>
								Settings
							</MenuItem>
							<MenuItem onClick={() => navigate("/about")}>
								<ListItemIcon>
									<MdiInformation />
								</ListItemIcon>
								About
							</MenuItem>
						</Menu>
					</Box>
				</Toolbar>
			</MuiAppBar>
		);
	}
};
