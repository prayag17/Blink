/** @format */
import PropTypes from "prop-types";

import { useQueryClient, useQuery, QueryClient } from "@tanstack/react-query";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";

import { theme } from "../../theme";

import { styled } from "@mui/material/styles";
import MuiAppBar from "@mui/material/AppBar";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import MuiDrawer from "@mui/material/Drawer";

import MenuIcon from "mdi-material-ui/Menu";

import { MediaCollectionTypeIconCollection } from "../../components/utils/iconsCollection.jsx";

import { useSelector, shallowEqual } from "react-redux";

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
	const queryClient = useQueryClient();
	const visible = useSelector((state) => state.sidebar.visible);
	let libraries = useQuery({
		queryKey: ["sidemenu", "libraries"],
		queryFn: async () => {
			let libs = await getLibraryApi(window.api).getMediaFolders();
			return libs.data;
		},
	});
	const handleDrawerOpen = () => {};
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
					// display: visible ? "block" : "none",
				},
			}}
			sx={{
				width: visible ? `calc(${theme.spacing(7)} + 10px)` : 0,
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
					<MenuIcon />
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
				<List sx={{ border: "none" }}>
					{libraries.data.Items.map((library, index) => {
						return (
							<Tooltip
								title={library.Name}
								placement="right"
								arrow
								followCursor
								key={index}
							>
								<ListItem disablePadding>
									<ListItemButton
										sx={{
											minHeight: 48,
											justifyContent: "center",
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
											{
												MediaCollectionTypeIconCollection[
													library
														.CollectionType
												]
											}
										</ListItemIcon>
									</ListItemButton>
								</ListItem>
							</Tooltip>
						);
					})}
				</List>
			)}
		</MiniDrawer>
	);
};

// SideMenu.propTypes = {
// 	skeleton: PropTypes.bool.isRequired,
// 	data: PropTypes.array.isRequired,
// };
