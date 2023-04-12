/** @format */
import { useEffect, useState } from "react";
import { delUser } from "../../utils/storage/user";

import { useQueryClient, useQuery, QueryClient } from "@tanstack/react-query";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import { useNavigate, NavLink, useLocation } from "react-router-dom";

import { theme } from "../../theme";

import { styled } from "@mui/material/styles";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import MuiDrawer from "@mui/material/Drawer";

import { MdiMenu } from "../icons/mdiMenu";
import { MdiLogoutVariant } from "../icons/mdiLogoutVariant";

import { MediaCollectionTypeIconCollection } from "../../components/utils/iconsCollection.jsx";

import { useSelector, useDispatch } from "react-redux";
import { hideSidemenu, setBackdrop } from "../../utils/slice/sidemenu";

import { MdiHomeVariantOutline } from "../icons/mdiHomeVariantOutline";

import "./sidemenu.module.scss";

const drawerWidth = 320;

const DrawerHeader = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
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
	// width: `calc(${theme.spacing(7)} + 10px)`,
}));

export const SideMenu = ({}) => {
	const location = useLocation();

	const [display, setDisplay] = useState(false);

	const visible = useSelector((state) => state.sidebar.visible);
	const backdrop = useSelector((state) => state.sidebar.backdrop);
	const navigate = useNavigate();
	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		enabled: false,
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
	const handleDrawerOpen = () => {};
	const dispatch = useDispatch();

	const handleLogout = async () => {
		console.log("Logging out user...");
		await window.api.logout();
		delUser();
		dispatch(hideSidemenu());
		navigate("/login");
	};

	const getCurrentPathWithoutParam = () => {
		return location.pathname.slice(0, location.pathname.lastIndexOf("/"));
	};

	useEffect(() => {
		if (
			getCurrentPathWithoutParam() != "/login" &&
			getCurrentPathWithoutParam() != "/setup/server"
		) {
			setDisplay(true);
		}
	}, [location]);

	if (!display) {
		return <></>;
	}

	if (display) {
		return (
			<MiniDrawer
				variant="permanent"
				open={false}
				PaperProps={{
					sx: {
						backgroundColor: "inherit",
						border: "none",
						width: visible
							? `calc(${theme.spacing(7)} + 10px)`
							: 0,
						height: "100vh",
						// display: visible ? "block" : "none",
					},
				}}
				sx={{
					width: visible
						? `calc(${theme.spacing(7)} + 10px)`
						: 0,
					background: backdrop
						? theme.palette.background.paper
						: "transparent",
				}}
			>
				<DrawerHeader
					className="Mui-DrawerHeader"
					sx={{
						justifyContent: "center",
					}}
				>
					{/* <div>
						<Avatar src={""}/>
						<Typography variant="h3">
						{user["Name"]}
						</Typography>
					</div> */}
					<IconButton
						color="inherit"
						aria-label="open drawer"
						onClick={handleDrawerOpen}
					>
						<MdiMenu />
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
												<NavLink
													to={
														"/library/" +
														library.Id
													}
													className={({
														isActive,
														isPending,
													}) =>
														isPending
															? "sidemenu-item-pending sidemenu-item"
															: isActive
															? "sidemenu-item-active sidemenu-item"
															: "sidemenu-item"
													}
												>
													<ListItemButton
														sx={{
															minHeight: 48,
															justifyContent:
																"center",
															px: 2.5,
														}}
														color="white"
													>
														<ListItemIcon
															sx={{
																minWidth: 0,
																justifyContent:
																	"center",
															}}
														>
															{
																MediaCollectionTypeIconCollection[
																	library
																		.CollectionType
																]
															}
														</ListItemIcon>
													</ListItemButton>
												</NavLink>
											</ListItem>
										</Tooltip>
									);
								},
							)}
						</List>
						<List sx={{ marginTop: "auto" }}>
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
									<NavLink
										to="/home"
										className={({
											isActive,
											isPending,
										}) =>
											isPending
												? "sidemenu-item-pending sidemenu-item"
												: isActive
												? "sidemenu-item-active sidemenu-item"
												: "sidemenu-item"
										}
									>
										<ListItemButton
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
												}}
											>
												<MdiHomeVariantOutline></MdiHomeVariantOutline>
											</ListItemIcon>
										</ListItemButton>
									</NavLink>
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
											justifyContent: "center",
											px: 2.5,
										}}
										onClick={handleLogout}
									>
										<ListItemIcon
											sx={{
												minWidth: 0,
												justifyContent:
													"center",
											}}
										>
											<MdiLogoutVariant></MdiLogoutVariant>
										</ListItemIcon>
									</ListItemButton>
								</ListItem>
							</Tooltip>
						</List>
					</>
				)}
			</MiniDrawer>
		);
	}
};

// SideMenu.propTypes = {
// 	skeleton: PropTypes.bool.isRequired,
// 	data: PropTypes.array.isRequired,
// };
