/** @format */

import SvgIcon from "@mui/material/SvgIcon";

import { mdiInformation } from "@mdi/js";

export const MdiInformation = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiInformation} />
		</SvgIcon>
	);
};
