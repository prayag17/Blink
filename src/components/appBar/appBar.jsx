/** @format */

import MuiAppBar from "@mui/material/AppBar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Toolbar from "@mui/material/Toolbar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";

import { MdiMagnify } from "../icons/mdiMagnify";
import { theme } from "../../theme";

import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { useQueryClient, useQuery } from "@tanstack/react-query";

import "./appBar.module.scss";
import { MdiAccount } from "../icons/mdiAccount";
import { MdiHeartOutline } from "../icons/mdiHeartOutline";

export const AppBar = () => {
	const visible = useSelector((state) => state.appBar.visible);
	const backdropVisible = useSelector((state) => state.appBar.backdrop);

	const location = useLocation();
	console.log(location);

	const user = useQuery({
		queryKey: ["appBar", "user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
	});

	return (
		visible && (
			<MuiAppBar
				sx={{
					width: `calc(100vw - ${theme.spacing(7)} - 20px)`,
					mr: "10px",
					background: "transparent",
				}}
				className={
					backdropVisible ? "appBar backdropVisible" : "appBar"
				}
				elevation={backdropVisible ? 6 : 0}
			>
				<Toolbar sx={{ justifyContent: "space-between" }}>
					<Box sx={{ display: "flex", gap: 1 }}>
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
						<IconButton sx={{ p: 0 }}>
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
					</Box>
				</Toolbar>
			</MuiAppBar>
		)
	);
};
