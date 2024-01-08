/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiMagnify } from "@mdi/js";

export const MdiMagnify = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiMagnify} />
		</SvgIcon>
	);
};
