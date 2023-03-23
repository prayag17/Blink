/** @format */
import SvgIcon from "@mui/material/SvgIcon";

import { mdiChevronLeft } from "@mdi/js";

export const MdiChevronLeft = (props) => {
	return (
		<SvgIcon {...props}>
			<path d={mdiChevronLeft}></path>
		</SvgIcon>
	);
};
