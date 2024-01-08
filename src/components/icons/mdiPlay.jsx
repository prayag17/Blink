/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiPlay } from "@mdi/js";

export const MdiPlay = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiPlay} />
		</SvgIcon>
	);
};
