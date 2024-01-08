/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiMusic } from "@mdi/js";

export const MdiMusic = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiMusic} />
		</SvgIcon>
	);
};
