/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiSkipPrevious } from "@mdi/js";

export const MdiSkipPrevious = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiSkipPrevious}></path>
		</SvgIcon>
	);
};
