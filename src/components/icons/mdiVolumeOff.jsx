/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiVolumeOff } from "@mdi/js";

export const MdiVolumeOff = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiVolumeOff} />
		</SvgIcon>
	);
};
