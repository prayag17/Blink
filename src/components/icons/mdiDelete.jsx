/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiDelete } from "@mdi/js";

export const MdiDelete = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiDelete} />
		</SvgIcon>
	);
};
