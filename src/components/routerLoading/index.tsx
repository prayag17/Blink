import { CircularProgress } from "@mui/material";
import { useRouterState } from "@tanstack/react-router";
import React from "react";

export default function RouterLoading() {
	const routeLoading = useRouterState().isLoading;
	if (!routeLoading) return null;
	return (
		<div
			style={{
				width: "100vw",
				height: "100vh",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				background: "rgb(0 0 0 / 0.35)",
				position: "fixed",
				zIndex: 10000,
			}}
		>
			<CircularProgress size={72} thickness={2} />
		</div>
	);
}