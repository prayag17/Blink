import SvgIcon from "@mui/material/SvgIcon";

import { mdiEyeOutline } from "@mdi/js";

export const MdiEyeOutline = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiEyeOutline} />
		</SvgIcon>
	);
};
