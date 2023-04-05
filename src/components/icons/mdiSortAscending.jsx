/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiSortAscending } from "@mdi/js";

export const MdiSortAscending = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiSortAscending}></path>
		</SvgIcon>
	);
};
