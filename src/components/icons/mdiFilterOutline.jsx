import SvgIcon from "@mui/material/SvgIcon";

import { mdiFilterOutline } from "@mdi/js";

export const MdiFilterOutline = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiFilterOutline} />
		</SvgIcon>
	);
};
