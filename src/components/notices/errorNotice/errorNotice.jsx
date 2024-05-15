import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { red } from "@mui/material/colors";
import React from "react";

export const ErrorNotice = ({ error }) => {
	console.log(error);
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
					"--clr": "rgb(198 40 40 / 30%)",
					fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 25, "opsz" 60',
				}}
			>
				error
			</div>
			<Typography variant="h3" fontWeight={300}>
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
				{JSON.stringify(error.message)}
			</Typography>
		</Box>
	);
};
