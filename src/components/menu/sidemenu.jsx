/** @format */
import { useEffect, useState } from "react";
import { delUser } from "../../utils/storage/user";

import { useQuery } from "@tanstack/react-query";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import { useNavigate, NavLink, useLocation } from "react-router-dom";

import { theme } from "../../theme";

import { styled } from "@mui/material/styles";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import MuiDrawer from "@mui/material/Drawer";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import { MdiClose } from "../icons/mdiClose";
import { MdiLogoutVariant } from "../icons/mdiLogoutVariant";

import { MediaCollectionTypeIconCollection } from "../../components/utils/iconsCollection.jsx";

import { MdiHomeVariantOutline } from "../icons/mdiHomeVariantOutline";

import { EventEmitter as event } from "../../eventEmitter.js";

import "./sidemenu.module.scss";
import { useDrawerStore } from "../../utils/store/drawer";
import { MdiHomeVariant } from "../icons/mdiHomeVariant";

const DrawerHeader = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	padding: theme.spacing(0, 1),
	...theme.mixins.toolbar,
}));

const MiniDrawer = styled(MuiDrawer, {
	shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
	flexShrink: 0,
	whiteSpace: "nowrap",
	boxSizing: "border-box",
	backgroundColor: theme.palette.primary.background.dark,
	overflowX: "hidden",
}));

export const SideMenu = ({}) => {
	const location = useLocation();

	const [display, setDisplay] = useState(false);

	const navigate = useNavigate();
	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		enabled: display,
		networkMode: "always",
	});
	let libraries = useQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			let libs = await getUserViewsApi(window.api).getUserViews({
				userId: user.data.Id,
			});
			return libs.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

	const handleLogout = async () => {
		console.log("Logging out user...");
		await window.api.logout();
		delUser();
		sessionStorage.removeItem("accessToken");
		event.emit("create-jellyfin-api", window.api.basePath);
		navigate("/login");
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

	const [open, setDrawerOpen] = useDrawerStore((state) => [
		state.open,
		state.setOpen,
	]);

	if (!display) {
		return <></>;
	}

	if (display) {
		return (
			<>
				<MiniDrawer
					variant="permanent"
					open={false}
					PaperProps={{
						sx: {
							backgroundColor: "inherit",
							border: "none",
							width: `5em`,
							height: "100vh",
							zIndex: "1",
						},
					}}
					sx={{
						zIndex: 1,
						width: `5em`,
						background: "transparent !important ",
					}}
				>
					<DrawerHeader
						className="Mui-DrawerHeader"
						sx={{
							justifyContent: "center",
						}}
					></DrawerHeader>
					<div className="sidemenu-item-container">
						{libraries.isLoading ? (
							<></>
						) : (
							<>
								<NavLink
									to="/home"
									className="sidemenu-item small"
								>
									<div className="sidemenu-item-icon">
										<MdiHomeVariantOutline />
									</div>
									<Typography
										className="sidemenu-item-text"
										variant="caption"
										fontWeight={500}
										style={{
											width: "80%",
										}}
										overflow="hidden"
										textOverflow="ellipsis"
										textAlign="center"
									>
										Home
									</Typography>
								</NavLink>
								{libraries.data.Items.map(
									(lib, index) => {
										return (
											<NavLink
												to={`/library/${lib.Id}`}
												className="sidemenu-item"
											>
												<div className="sidemenu-item-icon">
													{
														MediaCollectionTypeIconCollection[
															lib
																.CollectionType
														]
													}
												</div>
												<Typography
													className="sidemenu-item-text"
													variant="caption"
													fontWeight={
														500
													}
													style={{
														width: "80%",
													}}
													overflow="hidden"
													textOverflow="ellipsis"
													textAlign="center"
												>
													{lib.Name}
												</Typography>
											</NavLink>
										);
									},
								)}
							</>
						)}
					</div>
				</MiniDrawer>

				<MuiDrawer
					open={open}
					variant="persistent"
					onClose={() => setDrawerOpen(false)}
					elevation={0}
					PaperProps={{
						sx: {
							background: "rgb(0 0 0 / 0.5)",
							backdropFilter: "blur(10px)",
							boxShadow: "0 0 15px rgb(0 0 0 / 0.2)",
							width: 260,
						},
					}}
					className="sidemenu-open"
				>
					<DrawerHeader
						className="Mui-DrawerHeader"
						sx={{
							justifyContent: "flex-start",
						}}
					>
						<IconButton onClick={() => setDrawerOpen(false)}>
							<MdiClose />
						</IconButton>
					</DrawerHeader>
					<Divider />
					{libraries.isLoading ? (
						<>
							<Skeleton
								height="100%"
								variant="rounded"
								width="calc(100% - 10px )"
								sx={{ margin: "5px" }}
							></Skeleton>
						</>
					) : (
						<>
							<List sx={{ border: "none" }}>
								{libraries.data.Items.map(
									(library, index) => {
										return (
											<Tooltip
												title={library.Name}
												placement="right"
												arrow
												followCursor
												key={index}
											>
												<ListItem
													className="sidemenu-item-container"
													disablePadding
												>
													<ListItemButton
														component={
															NavLink
														}
														to={
															"/library/" +
															library.Id
														}
														className="sidemenu-item"
														sx={{
															minHeight: 48,
															justifyContent:
																"center",
															px: 2.5,
														}}
													>
														<ListItemIcon
															sx={{
																minWidth: 0,
																justifyContent:
																	"center",
																mr: 2,
															}}
														>
															{
																MediaCollectionTypeIconCollection[
																	library
																		.CollectionType
																]
															}
														</ListItemIcon>
														<ListItemText>
															{
																library.Name
															}
														</ListItemText>
													</ListItemButton>
												</ListItem>
											</Tooltip>
										);
									},
								)}
							</List>
							<List sx={{ marginTop: "auto" }}>
								<Divider />
								<Tooltip
									title="Home"
									placement="right"
									followCursor
									arrow
								>
									<ListItem
										className="sidemenu-item-container"
										disablePadding
									>
										<ListItemButton
											component={NavLink}
											to="/home"
											className="sidemenu-item"
											sx={{
												minHeight: 48,
												justifyContent:
													"center",
												px: 2.5,
											}}
										>
											<ListItemIcon
												sx={{
													minWidth: 0,
													justifyContent:
														"center",
													mr: 2,
												}}
											>
												<MdiHomeVariantOutline />
											</ListItemIcon>
											<ListItemText>
												Home
											</ListItemText>
										</ListItemButton>
									</ListItem>
								</Tooltip>
								<Tooltip
									title="Logout"
									placement="right"
									followCursor
									arrow
								>
									<ListItem disablePadding>
										<ListItemButton
											sx={{
												minHeight: 48,
												justifyContent:
													"center",
												px: 2.5,
											}}
											onClick={handleLogout}
										>
											<ListItemIcon
												sx={{
													minWidth: 0,
													justifyContent:
														"center",
													mr: 2,
												}}
											>
												<MdiLogoutVariant></MdiLogoutVariant>
											</ListItemIcon>
											<ListItemText>
												Logout
											</ListItemText>
										</ListItemButton>
									</ListItem>
								</Tooltip>
							</List>
						</>
					)}
				</MuiDrawer>
			</>
		);
	}
};
