/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiPause } from "@mdi/js";

export const MdiPause = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiPause}></path>
		</SvgIcon>
	);
};
