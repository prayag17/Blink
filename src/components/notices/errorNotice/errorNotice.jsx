/** @format */
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { red } from "@mui/material/colors";

export const ErrorNotice = ({ error, resetErrorBoundary }) => {
	console.error(error);
	return (
		<Box
			sx={{
				width: "100%",
				height: "100vh",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				flexFlow: "column",
				// opacity: 0.2,
			}}
		>
			<div
				className="material-symbols-rounded animate-icon"
				style={{
					fontSize: "10em",
					color: red[800],
				}}
			>
				error
			</div>
			<Typography
				variant="h3"
				fontFamily="JetBrains Mono Variable"
				fontWeight={100}
			>
				Something went wrong
			</Typography>
			<Typography
				fontFamily="JetBrains Mono Variable"
				fontWeight={100}
				variant="h5"
				style={{
					padding: "0.5em",
					background: "rgb(0 0 0 / 1)",
					borderRadius: "8px",
					border: "2px dashed rgb(255 255 255 / 0.5)",
					maxWidth: "40em",
					marginTop: "1em",
					// opacity: 0.6,
				}}
			>
				{error.message}
			</Typography>
			<Button
				size="large"
				variant="contained"
				onClick={resetErrorBoundary ? resetErrorBoundary : () => {}}
				style={{
					marginTop: "1em",
				}}
			>
				Retry
			</Button>
		</Box>
	);
};
