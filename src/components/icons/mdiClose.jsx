/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiClose } from "@mdi/js";

export const MdiClose = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiClose}></path>
		</SvgIcon>
	);
};
