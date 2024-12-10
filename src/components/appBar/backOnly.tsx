import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import { useLocation, useRouter } from "@tanstack/react-router";
import React from "react";
import QuickConnectButton from "../buttons/quickConnectButton";

export default function AppBarBackOnly() {
	const { history } = useRouter();
	const location = useLocation();

	const handleBack = () => {
		history.go(-1);
	};

	const hideQuickConnect = location.pathname === "/setup/server/list";

	return (
		<AppBar elevation={0} color="transparent" position="fixed">
			<Toolbar>
				<IconButton
					size="large"
					edge="start"
					//@ts-ignore
					color="white"
					aria-label="back"
					disabled={history.length <= 1}
					onClick={handleBack}
					sx={{ mr: 2 }}
				>
					<span className="material-symbols-rounded">arrow_back</span>
				</IconButton>
				{!hideQuickConnect && (
					<QuickConnectButton
						sx={{
							marginLeft: "auto",
							flex: "none !important",
							borderRadius: "10px",
						}}
						color="secondary"
					/>
				)}
			</Toolbar>
		</AppBar>
	);
};
