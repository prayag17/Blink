/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiChevronDown } from "@mdi/js";

export const MdiChevronDown = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiChevronDown}></path>
		</SvgIcon>
	);
};
