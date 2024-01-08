/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiAlertDecagram } from "@mdi/js";

export const MdiAlertDecagram = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiAlertDecagram} />
		</SvgIcon>
	);
};
