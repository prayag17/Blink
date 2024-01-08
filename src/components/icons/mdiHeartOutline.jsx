/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiHeartOutline } from "@mdi/js";

export const MdiHeartOutline = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiHeartOutline} />
		</SvgIcon>
	);
};
