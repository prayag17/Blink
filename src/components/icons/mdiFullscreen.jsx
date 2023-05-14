/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiFullscreen } from "@mdi/js";

export const MdiFullscreen = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiFullscreen}></path>
		</SvgIcon>
	);
};
