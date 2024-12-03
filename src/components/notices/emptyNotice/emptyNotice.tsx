
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { yellow } from "@mui/material/colors";
import React from "react";

export const EmptyNotice = ({ extraMsg }: { extraMsg?: string }) => {
	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				flexFlow: "column",
				position: "static",
				top: 0,
				left: 0,
			}}
		>
			<div
				className="material-symbols-rounded"
				style={{
					fontSize: "10em",
					color: yellow[800],
					fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 25, "opsz" 60',
				}}
			>
				sentiment_dissatisfied
			</div>
			<Typography variant="h4" fontWeight={300}>
				No results found
			</Typography>
			<Typography variant="subtitle1" fontWeight={300} style={{ opacity: 0.5 }}>
				{extraMsg}
			</Typography>
		</Box>
	);
};
