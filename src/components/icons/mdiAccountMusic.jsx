/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiAccountMusic } from "@mdi/js";

export const MdiAccountMusic = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiAccountMusic} />
		</SvgIcon>
	);
};
