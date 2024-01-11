import React, { useEffect, useState } from "react";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { useQuery } from "@tanstack/react-query";

import { NavLink, useLocation } from "react-router-dom";

import MuiDrawer from "@mui/material/Drawer";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";

import { getTypeIcon } from "../../components/utils/iconsCollection.jsx";

import { useApi } from "../../utils/store/api";
import "./sidemenu.module.scss";

import Icon from "../../assets/icon.svg";

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

export const SideMenu = () => {
	const [api] = useApi((state) => [state.api]);
	const location = useLocation();

	const [display, setDisplay] = useState(false);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		enabled: display,
		networkMode: "always",
	});
	const libraries = useQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			const libs = await getUserViewsApi(api).getUserViews({
				userId: user.data.Id,
			});
			return libs.data;
		},
		enabled: !!user.data,
		networkMode: "always",
	});

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
							width: "5em",
							height: "100vh",
							zIndex: "1",
						},
					}}
					sx={{
						zIndex: 1,
						width: "5em",
						background: "transparent !important ",
					}}
				>
					<DrawerHeader
						className="Mui-DrawerHeader"
						sx={{
							justifyContent: "center",
						}}
					>
						<img alt="JellyPlayer" src={Icon} className="sidemenu-icon" />
					</DrawerHeader>
					<div className="sidemenu-item-container">
						{libraries.isPending ? (
							<></>
						) : (
							<>
								<NavLink to="/home" className="sidemenu-item small">
									<div className="sidemenu-item-icon">
										{getTypeIcon("Home")}
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
								{libraries.data.Items.map((lib) => {
									return (
										<Tooltip
											title={lib.Name}
											placement="right"
											arrow
											followCursor
											key={lib.Id}
										>
											<NavLink
												to={`/library/${lib.Id}`}
												className="sidemenu-item"
											>
												<div className="sidemenu-item-icon">
													{getTypeIcon(lib.CollectionType)}
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
													{lib.Name}
												</Typography>
											</NavLink>
										</Tooltip>
									);
								})}
							</>
						)}
					</div>
				</MiniDrawer>
			</>
		);
	}
};
