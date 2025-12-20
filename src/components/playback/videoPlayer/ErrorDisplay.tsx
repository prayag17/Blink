import { Button, Typography } from "@mui/material";
import React from "react";

interface ErrorDisplayProps {
	error: any;
	onRetry?: () => void;
	onExit?: () => void;
}

const ErrorDisplay = ({ error, onRetry, onExit }: ErrorDisplayProps) => {
	if (!error) return null;

	return (
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				backgroundColor: "rgba(0, 0, 0, 0.8)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 100,
				color: "white",
				gap: "1rem",
			}}
		>
			<Typography variant="h5" color="error">
				Playback Error
			</Typography>
			<Typography variant="body1">
				{error.message || "An unknown error occurred during playback."}
			</Typography>
			<div style={{ display: "flex", gap: "1rem" }}>
				{onRetry && (
					<Button variant="contained" color="primary" onClick={onRetry}>
						Retry
					</Button>
				)}
				{onExit && (
					<Button variant="outlined" color="secondary" onClick={onExit}>
						Exit
					</Button>
				)}
			</div>
		</div>
	);
};

export default ErrorDisplay;
