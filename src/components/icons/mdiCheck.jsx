/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiCheck } from "@mdi/js";

export const MdiCheck = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiCheck} />
		</SvgIcon>
	);
};
