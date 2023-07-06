/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiBackburger } from "@mdi/js";

export const MdiBackburger = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiBackburger}></path>
		</SvgIcon>
	);
};
