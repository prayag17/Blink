/** @format */
import { useEffect } from "react";

import MuiAppBar from "@mui/material/AppBar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Zoom from "@mui/material/Zoom";

import { MdiMagnify } from "../icons/mdiMagnify";
import { theme } from "../../theme";

import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { hideBackButton } from "../../utils/slice/appBar";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { useQueryClient, useQuery } from "@tanstack/react-query";

import "./appBar.module.scss";
import { MdiAccount } from "../icons/mdiAccount";
import { MdiHeartOutline } from "../icons/mdiHeartOutline";
import { MdiArrowLeft } from "../icons/mdiArrowLeft";

export const AppBar = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const visible = useSelector((state) => state.appBar.visible);
	const backButtonVisible = useSelector(
		(state) => state.appBar.backButtonVisible,
	);
	const backdropVisible = useSelector((state) => state.appBar.backdrop);

	const location = useLocation();

	const user = useQuery({
		queryKey: ["appBar", "user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
	});

	useEffect(() => {
		if (location.pathname == "/home") {
			dispatch(hideBackButton());
		}
	});

	return (
		visible && (
			<MuiAppBar
				sx={{
					width: `calc(100vw - ${theme.spacing(7)} - 10px)`,
					// mr: "10px",
					background: "transparent",
				}}
				className={
					backdropVisible ? "appBar backdropVisible" : "appBar"
				}
				elevation={backdropVisible ? 6 : 0}
			>
				<Toolbar sx={{ justifyContent: "space-between" }}>
					<Box
						sx={{
							display: "flex",
							gap: 1,
							alignItems: "center",
						}}
					>
						<IconButton
							onClick={() => navigate(-1)}
							sx={{
								transition: "transform 0.2s",
								transform: backButtonVisible
									? "scale(1)"
									: "scale(0)",
								transformOrigin: "left",
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
