/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiImage } from "@mdi/js";

export const MdiImage = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiImage}></path>
		</SvgIcon>
	);
};
