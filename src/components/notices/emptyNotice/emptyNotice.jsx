/** @format */

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { yellow } from "@mui/material/colors";

export const EmptyNotice = () => {
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
					color: yellow[800],
					"--clr": yellow[800],
				}}
			>
				error
			</div>
			<Typography
				variant="h3"
				fontFamily="JetBrains Mono Variable"
				fontWeight={100}
			>
				No results found
			</Typography>
		</Box>
	);
};
