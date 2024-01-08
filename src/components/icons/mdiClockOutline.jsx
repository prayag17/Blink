/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiClockOutline } from "@mdi/js";

export const MdiClockOutline = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiClockOutline} />
		</SvgIcon>
	);
};
