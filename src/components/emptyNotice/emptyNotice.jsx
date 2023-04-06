/** @format */

import Box from "@mui/material/Box";
import { MdiEmoticonCryOutline } from "../icons/mdiEmoticonCryOutline";
import Typography from "@mui/material/Typography";

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
				opacity: 0.2,
			}}
		>
			<MdiEmoticonCryOutline sx={{ fontSize: 200 }} />
			<Typography variant="h3">Nothing found</Typography>
		</Box>
	);
};
