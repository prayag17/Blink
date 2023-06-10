/** @format */

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MdiEmoticonDead } from "../../icons/mdiEmoticonDead";

export const ErrorNotice = () => {
	return (
		<Box
			sx={{
				width: "100%",
				height: "100vh",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				flexFlow: "column",
				opacity: 0.2,
			}}
		>
			<MdiEmoticonDead sx={{ fontSize: 200 }} />
			<Typography variant="h3">Something went wrong</Typography>
		</Box>
	);
};
