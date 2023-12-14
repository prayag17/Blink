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
				height: "100%",
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
					fontVariationSettings:
						'"FILL" 0, "wght" 100, "GRAD" 25, "opsz" 40',
					"--clr": "rgb(249 168 37 / 30%)",
				}}
			>
				sentiment_dissatisfied
			</div>
			<Typography variant="h3" fontWeight={100}>
				No results found
			</Typography>
		</Box>
	);
};
