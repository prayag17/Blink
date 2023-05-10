/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiRewind } from "@mdi/js";

export const MdiRewind = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiRewind}></path>
		</SvgIcon>
	);
};
