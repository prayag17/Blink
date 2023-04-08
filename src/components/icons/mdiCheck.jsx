/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiCheck } from "@mdi/js";

export const MdiCheck = (props) => {
	return (
		<SvgIcon color="red" {...props}>
			<path d={mdiCheck}></path>
		</SvgIcon>
	);
};
