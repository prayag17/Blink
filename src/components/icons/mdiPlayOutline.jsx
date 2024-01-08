/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiPlayOutline } from "@mdi/js";

export const MdiPlayOutline = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiPlayOutline} />
		</SvgIcon>
	);
};
